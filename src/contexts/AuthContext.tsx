import * as React from "react"
import {
  initiateUserPasswordAuth,
  initiateRefresh,
  respondNewPassword,
  associateSoftwareToken,
  verifySoftwareToken,
  respondMfaSetup,
  respondSoftwareTokenMfa,
  respondDeviceSrpAuth,
  confirmDevice,
  parseIdTokenClaims,
} from "@/lib/cognito"
import { tokenStorage } from "@/lib/tokenStorage"
import { setAuthBridge } from "@/lib/authBridge"
import { apiFetch } from "@/services/apiClient"

export type UserRole = "manager" | "supervisor" | "host" | "staff"

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface UserAttributes {
  email: string
  name: string
  sub: string
}

export type SignInResult =
  | { kind: "tokens" }
  | { kind: "newPasswordRequired" }
  | { kind: "mfaSetup" }
  | { kind: "mfaPrompt" }

export type PendingChallenge =
  | { kind: "newPasswordRequired"; session: string; username: string }
  | { kind: "mfaSetup"; session: string; username: string }
  | { kind: "mfaPrompt"; session: string; username: string }

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null
  userAttributes: UserAttributes | null
  userGroups: UserRole[]
  pendingChallenge: PendingChallenge | null

  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>

  completeNewPassword: (newPassword: string) => Promise<SignInResult>
  setupTotp: () => Promise<{ secretCode: string; otpauthUrl: string }>
  verifyTotp: (userCode: string) => Promise<SignInResult>
  confirmMfa: (code: string) => Promise<SignInResult>

  forgotPassword: (
    email: string,
  ) => Promise<{ deliveryMedium: string; destination: string }>
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>

  hasRole: (role: UserRole) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const ROLE_SET: ReadonlySet<UserRole> = new Set<UserRole>([
  "manager",
  "supervisor",
  "host",
  "staff",
])

function toUserRoles(groups: string[]): UserRole[] {
  return groups.filter((g): g is UserRole => ROLE_SET.has(g as UserRole))
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [userAttributes, setUserAttributes] =
    React.useState<UserAttributes | null>(null)
  const [userGroups, setUserGroups] = React.useState<UserRole[]>([])
  const [pendingChallenge, setPendingChallenge] =
    React.useState<PendingChallenge | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // In-memory token state. Stored in refs so apiClient bridge reads the
  // latest values without re-renders.
  const accessTokenRef = React.useRef<string | null>(null)
  const idTokenRef = React.useRef<string | null>(null)
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Forward-reference shim: armRefreshTimer is declared before
  // refreshTokensSilent, but the timer callback needs the latest version.
  // We assign refreshTokensSilent into this ref via an effect below.
  const refreshTokensSilentRef = React.useRef<() => Promise<boolean>>(
    () => Promise.resolve(false),
  )

  const clearAuth = React.useCallback(() => {
    accessTokenRef.current = null
    idTokenRef.current = null
    setUser(null)
    setUserAttributes(null)
    setUserGroups([])
    setPendingChallenge(null)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const armRefreshTimer = React.useCallback((exp: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const ms = Math.max(0, exp * 1000 - Date.now() - 5 * 60 * 1000)
    refreshTimerRef.current = setTimeout(() => {
      void refreshTokensSilentRef.current()
    }, ms)
  }, [])

  const hydrateTokens = React.useCallback(
    (auth: {
      AccessToken?: string
      IdToken?: string
      RefreshToken?: string
      NewDeviceMetadata?: { DeviceKey?: string; DeviceGroupKey?: string }
    }) => {
      if (!auth.AccessToken || !auth.IdToken) {
        throw new Error("Missing tokens on AuthenticationResult")
      }
      accessTokenRef.current = auth.AccessToken
      idTokenRef.current = auth.IdToken
      const claims = parseIdTokenClaims(auth.IdToken)
      setUser({ id: claims.sub, email: claims.email, name: claims.name })
      setUserAttributes({
        email: claims.email,
        name: claims.name,
        sub: claims.sub,
      })
      setUserGroups(toUserRoles(claims.groups))
      setPendingChallenge(null)
      tokenStorage.save({
        refreshToken: auth.RefreshToken,
        deviceKey: auth.NewDeviceMetadata?.DeviceKey,
        deviceGroupKey: auth.NewDeviceMetadata?.DeviceGroupKey,
      })
      armRefreshTimer(claims.exp)

      // Register the device with Cognito so subsequent sign-ins skip MFA.
      // Fire-and-forget: a failure means MFA re-prompts next time, not a
      // sign-in blocker.
      //
      // Two paths fire ConfirmDevice:
      //   1. Fresh enrollment — Cognito emits NewDeviceMetadata on this auth.
      //   2. Migration — a previous sign-in stashed deviceKey/deviceGroupKey
      //      but never confirmed (e.g., enrolled before this code shipped).
      //      Cognito will not re-emit NewDeviceMetadata for an already-known
      //      device, so we opportunistically confirm using stored values.
      const accessToken = auth.AccessToken
      const fromMetadata =
        auth.NewDeviceMetadata?.DeviceKey &&
        auth.NewDeviceMetadata?.DeviceGroupKey
          ? {
              deviceKey: auth.NewDeviceMetadata.DeviceKey,
              deviceGroupKey: auth.NewDeviceMetadata.DeviceGroupKey,
              isMigration: false,
            }
          : null
      const fromStorage =
        !tokenStorage.devicePassword &&
        tokenStorage.deviceKey &&
        tokenStorage.deviceGroupKey
          ? {
              deviceKey: tokenStorage.deviceKey,
              deviceGroupKey: tokenStorage.deviceGroupKey,
              isMigration: true,
            }
          : null
      const target = fromMetadata ?? fromStorage
      if (accessToken && target) {
        void confirmDevice(
          accessToken,
          target.deviceKey,
          target.deviceGroupKey,
        )
          .then(({ devicePassword }) => {
            tokenStorage.save({ devicePassword })
          })
          .catch((err) => {
            console.warn(
              "ConfirmDevice failed — remembered-device MFA skip will not take effect",
              err,
            )
            // Migration path: the stored DeviceKey was unusable. Drop it so
            // the next sign-in lets Cognito issue fresh NewDeviceMetadata
            // instead of looping on a dead key.
            if (target.isMigration) tokenStorage.clearDevice()
          })
      }
    },
    [armRefreshTimer],
  )

  const refreshTokensSilent = React.useCallback(async (): Promise<boolean> => {
    const refreshToken = tokenStorage.refreshToken
    if (!refreshToken) return false
    try {
      const outcome = await initiateRefresh(
        refreshToken,
        tokenStorage.deviceKey,
      )
      if ("authenticationResult" in outcome) {
        hydrateTokens(outcome.authenticationResult)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [hydrateTokens])

  // Keep the ref in sync so armRefreshTimer's setTimeout always calls the
  // latest refresh function.
  React.useEffect(() => {
    refreshTokensSilentRef.current = refreshTokensSilent
  }, [refreshTokensSilent])

  const signIn = React.useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      try {
        const outcome = await initiateUserPasswordAuth(
          email,
          password,
          tokenStorage.deviceKey,
        )
        if ("authenticationResult" in outcome) {
          hydrateTokens(outcome.authenticationResult)
          return { kind: "tokens" }
        }

        // DEVICE_SRP_AUTH is an internal Cognito challenge that proves the
        // SDK still holds the device's SRP password. We run the two-step
        // exchange transparently and re-evaluate the resulting outcome —
        // user never sees this state. If our local devicePassword went
        // missing, the device state is inconsistent: drop it so the next
        // sign-in can re-enroll.
        let nextOutcome: typeof outcome = outcome
        if (outcome.challengeName === "DEVICE_SRP_AUTH") {
          const deviceKey = tokenStorage.deviceKey
          const deviceGroupKey = tokenStorage.deviceGroupKey
          const devicePassword = tokenStorage.devicePassword
          if (!deviceKey || !deviceGroupKey || !devicePassword) {
            tokenStorage.clearDevice()
            throw new Error(
              "Device state is out of sync. Please sign in again.",
            )
          }
          const deviceOutcome = await respondDeviceSrpAuth(
            outcome.session,
            email,
            deviceKey,
            deviceGroupKey,
            devicePassword,
          )
          if ("authenticationResult" in deviceOutcome) {
            hydrateTokens(deviceOutcome.authenticationResult)
            return { kind: "tokens" }
          }
          nextOutcome = deviceOutcome
        }

        const kindMap: Record<
          string,
          "newPasswordRequired" | "mfaSetup" | "mfaPrompt"
        > = {
          NEW_PASSWORD_REQUIRED: "newPasswordRequired",
          MFA_SETUP: "mfaSetup",
          SOFTWARE_TOKEN_MFA: "mfaPrompt",
        }
        const kind = kindMap[nextOutcome.challengeName]
        if (!kind) {
          throw new Error(
            `Unsupported Cognito challenge: ${nextOutcome.challengeName}`,
          )
        }
        setPendingChallenge({
          kind,
          session: nextOutcome.session,
          username: email,
        })
        return { kind }
      } catch (err) {
        const name = (err as { name?: string }).name
        if (name === "NotAuthorizedException" || name === "UserNotFoundException") {
          throw new Error("Email or password incorrect.", { cause: err })
        }
        throw err
      }
    },
    [hydrateTokens],
  )

  const signOut = React.useCallback(async () => {
    clearAuth()
    // Keep device keys so the next sign-in on this browser still presents as
    // a remembered device and skips MFA.
    tokenStorage.clearSession()
  }, [clearAuth])

  const completeNewPassword = React.useCallback(
    async (newPassword: string): Promise<SignInResult> => {
      if (pendingChallenge?.kind !== "newPasswordRequired") {
        throw new Error("No pending NEW_PASSWORD_REQUIRED challenge")
      }
      const outcome = await respondNewPassword(
        pendingChallenge.session,
        pendingChallenge.username,
        newPassword,
      )
      if ("authenticationResult" in outcome) {
        hydrateTokens(outcome.authenticationResult)
        return { kind: "tokens" }
      }
      if (outcome.challengeName === "MFA_SETUP") {
        setPendingChallenge({
          kind: "mfaSetup",
          session: outcome.session,
          username: pendingChallenge.username,
        })
        return { kind: "mfaSetup" }
      }
      if (outcome.challengeName === "SOFTWARE_TOKEN_MFA") {
        setPendingChallenge({
          kind: "mfaPrompt",
          session: outcome.session,
          username: pendingChallenge.username,
        })
        return { kind: "mfaPrompt" }
      }
      throw new Error(
        `Unexpected challenge after new password: ${outcome.challengeName}`,
      )
    },
    [pendingChallenge, hydrateTokens],
  )

  const setupTotp = React.useCallback(async () => {
    if (pendingChallenge?.kind !== "mfaSetup") {
      throw new Error("No pending MFA_SETUP challenge")
    }
    const { secretCode, session } = await associateSoftwareToken(
      pendingChallenge.session,
    )
    setPendingChallenge({
      kind: "mfaSetup",
      session,
      username: pendingChallenge.username,
    })
    const otpauthUrl = `otpauth://totp/TSU:${encodeURIComponent(
      pendingChallenge.username,
    )}?secret=${secretCode}&issuer=TSU`
    return { secretCode, otpauthUrl }
  }, [pendingChallenge])

  const verifyTotp = React.useCallback(
    async (userCode: string): Promise<SignInResult> => {
      if (pendingChallenge?.kind !== "mfaSetup") {
        throw new Error("No pending MFA_SETUP challenge")
      }
      const verify = await verifySoftwareToken(pendingChallenge.session, userCode)
      if (verify.status !== "SUCCESS" || !verify.session) {
        throw new Error("Code is incorrect or expired.")
      }
      const outcome = await respondMfaSetup(verify.session, pendingChallenge.username)
      if ("authenticationResult" in outcome) {
        hydrateTokens(outcome.authenticationResult)
        return { kind: "tokens" }
      }
      throw new Error(
        `Unexpected challenge after MFA setup: ${outcome.challengeName}`,
      )
    },
    [pendingChallenge, hydrateTokens],
  )

  const confirmMfa = React.useCallback(
    async (code: string): Promise<SignInResult> => {
      if (pendingChallenge?.kind !== "mfaPrompt") {
        throw new Error("No pending SOFTWARE_TOKEN_MFA challenge")
      }
      const outcome = await respondSoftwareTokenMfa(
        pendingChallenge.session,
        pendingChallenge.username,
        code,
      )
      if ("authenticationResult" in outcome) {
        hydrateTokens(outcome.authenticationResult)
        return { kind: "tokens" }
      }
      throw new Error(
        `Unexpected challenge after MFA prompt: ${outcome.challengeName}`,
      )
    },
    [pendingChallenge, hydrateTokens],
  )

  const forgotPassword = React.useCallback(async (email: string) => {
    const res = await apiFetch<{ deliveryMedium: string; destination: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
    )
    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? "Could not start password reset.")
    }
    return res.data
  }, [])

  const resetPassword = React.useCallback(
    async (email: string, code: string, newPassword: string) => {
      const res = await apiFetch<void>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      })
      if (!res.success) {
        throw new Error(res.error?.message ?? "Could not reset password.")
      }
    },
    [],
  )

  // Boot rehydration
  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      const ok = await refreshTokensSilent()
      if (!cancelled) {
        // Refresh may fail simply because the 5-day window elapsed; keep
        // device keys so the manual sign-in that follows still skips MFA.
        if (!ok) tokenStorage.clearSession()
        setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshTokensSilent])

  // Bridge wire-up — apiClient reads idToken via these closures
  React.useEffect(() => {
    setAuthBridge({
      getIdToken: () => idTokenRef.current,
      tryRefresh: refreshTokensSilent,
      onAuthFailure: () => {
        clearAuth()
        tokenStorage.clear()
      },
    })
  }, [refreshTokensSilent, clearAuth])

  // Cleanup refresh timer on unmount
  React.useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  const hasRole = React.useCallback(
    (role: UserRole) => userGroups.includes(role),
    [userGroups],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isLoading,
      user,
      userAttributes,
      userGroups,
      pendingChallenge,
      signIn,
      signOut,
      completeNewPassword,
      setupTotp,
      verifyTotp,
      confirmMfa,
      forgotPassword,
      resetPassword,
      hasRole,
    }),
    [
      user,
      isLoading,
      userAttributes,
      userGroups,
      pendingChallenge,
      signIn,
      signOut,
      completeNewPassword,
      setupTotp,
      verifyTotp,
      confirmMfa,
      forgotPassword,
      resetPassword,
      hasRole,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return ctx
}
