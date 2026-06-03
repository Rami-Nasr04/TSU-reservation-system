import * as React from "react"
import {
  initiateUserPasswordAuth,
  initiateRefresh,
  parseIdTokenClaims,
} from "@/lib/cognito"
import { tokenStorage } from "@/lib/tokenStorage"
import { setAuthBridge } from "@/lib/authBridge"

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
        const kindMap: Record<
          string,
          "newPasswordRequired" | "mfaSetup" | "mfaPrompt"
        > = {
          NEW_PASSWORD_REQUIRED: "newPasswordRequired",
          MFA_SETUP: "mfaSetup",
          SOFTWARE_TOKEN_MFA: "mfaPrompt",
        }
        const kind = kindMap[outcome.challengeName]
        if (!kind) {
          throw new Error(
            `Unsupported Cognito challenge: ${outcome.challengeName}`,
          )
        }
        setPendingChallenge({ kind, session: outcome.session, username: email })
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
    tokenStorage.clear()
  }, [clearAuth])

  const completeNewPassword = React.useCallback(
    async (): Promise<SignInResult> => {
      throw new Error("placeholder — implemented in B2")
    },
    [],
  )

  const setupTotp = React.useCallback(async () => {
    throw new Error("placeholder — implemented in B2")
  }, [])

  const verifyTotp = React.useCallback(async () => {
    throw new Error("placeholder — implemented in B2")
  }, [])

  const confirmMfa = React.useCallback(async () => {
    throw new Error("placeholder — implemented in B2")
  }, [])

  const forgotPassword = React.useCallback(async () => {
    throw new Error("placeholder — implemented in B3")
  }, [])

  const resetPassword = React.useCallback(async () => {
    throw new Error("placeholder — implemented in B3")
  }, [])

  // Boot rehydration
  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      const ok = await refreshTokensSilent()
      if (!cancelled) {
        if (!ok) tokenStorage.clear()
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
