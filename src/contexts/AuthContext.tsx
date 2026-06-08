import * as React from "react"
import {
  CognitoUser,
  AuthenticationDetails,
  type CognitoUserSession,
  type IAuthenticationCallback,
} from "amazon-cognito-identity-js"
import { userPool } from "@/lib/cognito"

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

// Internal challenge state — preserved across the auth pages.
type PendingChallenge =
  | { kind: "newPasswordRequired" }
  | { kind: "mfaSetup" }
  | { kind: "mfaPrompt" }

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

  forgotPassword: (email: string) => Promise<void>
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

function parseSession(session: CognitoUserSession): {
  user: AuthUser
  attrs: UserAttributes
  groups: UserRole[]
} {
  const payload = session.getIdToken().decodePayload()
  let rawGroups: string[] = []
  const g = payload["cognito:groups"]
  if (Array.isArray(g)) rawGroups = g
  else if (typeof g === "string") rawGroups = [g]
  return {
    user: {
      id: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    },
    attrs: {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    },
    groups: toUserRoles(rawGroups),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [userAttributes, setUserAttributes] =
    React.useState<UserAttributes | null>(null)
  const [userGroups, setUserGroups] = React.useState<UserRole[]>([])
  const [pendingChallenge, setPendingChallenge] =
    React.useState<PendingChallenge | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // CognitoUser instance preserved across challenges (newPasswordRequired,
  // MFA setup, MFA prompt) so each follow-up callback can be invoked on the
  // same in-flight authenticateUser session.
  const cognitoUserRef = React.useRef<CognitoUser | null>(null)
  // Attributes returned with newPasswordRequired — passed into
  // completeNewPasswordChallenge after stripping read-only fields.
  const newPasswordAttrsRef = React.useRef<Record<string, string> | null>(null)

  const adoptSession = React.useCallback((session: CognitoUserSession) => {
    const parsed = parseSession(session)
    setUser(parsed.user)
    setUserAttributes(parsed.attrs)
    setUserGroups(parsed.groups)
    setPendingChallenge(null)
  }, [])

  // Boot rehydration — getSession() refreshes if needed.
  React.useEffect(() => {
    let cancelled = false
    const current = userPool.getCurrentUser()
    if (!current) {
      // No persisted user. Defer the state flip to a microtask so it isn't a
      // synchronous setState in the effect body (react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        if (!cancelled) setIsLoading(false)
      })
      return () => {
        cancelled = true
      }
    }
    current.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (cancelled) return
        if (!err && session?.isValid()) adoptSession(session)
        setIsLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [adoptSession])

  const signIn = React.useCallback(
    (email: string, password: string): Promise<SignInResult> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
        cognitoUserRef.current = cognitoUser
        const authDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        })
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            adoptSession(session)
            resolve({ kind: "tokens" })
          },
          onFailure: (err) => {
            const name = (err as { code?: string; name?: string }).code ?? err.name
            if (
              name === "NotAuthorizedException" ||
              name === "UserNotFoundException"
            ) {
              reject(new Error("Email or password incorrect.", { cause: err }))
            } else {
              reject(err)
            }
          },
          newPasswordRequired: (userAttrs) => {
            newPasswordAttrsRef.current = userAttrs
            setPendingChallenge({ kind: "newPasswordRequired" })
            resolve({ kind: "newPasswordRequired" })
          },
          mfaSetup: () => {
            setPendingChallenge({ kind: "mfaSetup" })
            resolve({ kind: "mfaSetup" })
          },
          totpRequired: () => {
            setPendingChallenge({ kind: "mfaPrompt" })
            resolve({ kind: "mfaPrompt" })
          },
          mfaRequired: () => {
            // Treat any MFA challenge (SMS or TOTP) the same — only TOTP is
            // enabled at pool level.
            setPendingChallenge({ kind: "mfaPrompt" })
            resolve({ kind: "mfaPrompt" })
          },
        })
      })
    },
    [adoptSession],
  )

  const signOut = React.useCallback(async () => {
    const current = userPool.getCurrentUser()
    current?.signOut() // clears refresh + access + id tokens from localStorage
    setUser(null)
    setUserAttributes(null)
    setUserGroups([])
    setPendingChallenge(null)
    cognitoUserRef.current = null
    newPasswordAttrsRef.current = null
  }, [])

  const completeNewPassword = React.useCallback(
    (newPassword: string): Promise<SignInResult> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = cognitoUserRef.current
        if (!cognitoUser) {
          return reject(new Error("No pending NEW_PASSWORD_REQUIRED challenge"))
        }
        const attrs = { ...(newPasswordAttrsRef.current ?? {}) }
        // Cognito rejects read-only / already-set attrs on this challenge.
        delete attrs.email_verified
        delete attrs.phone_number_verified
        delete attrs.sub
        delete attrs.email
        delete attrs.phone_number
        cognitoUser.completeNewPasswordChallenge(newPassword, attrs, {
          onSuccess: (session) => {
            adoptSession(session)
            resolve({ kind: "tokens" })
          },
          onFailure: (err) => reject(err),
          mfaSetup: () => {
            setPendingChallenge({ kind: "mfaSetup" })
            resolve({ kind: "mfaSetup" })
          },
          totpRequired: () => {
            setPendingChallenge({ kind: "mfaPrompt" })
            resolve({ kind: "mfaPrompt" })
          },
          mfaRequired: () => {
            setPendingChallenge({ kind: "mfaPrompt" })
            resolve({ kind: "mfaPrompt" })
          },
        })
      })
    },
    [adoptSession],
  )

  const setupTotp = React.useCallback((): Promise<{
    secretCode: string
    otpauthUrl: string
  }> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = cognitoUserRef.current
      if (!cognitoUser)
        return reject(new Error("No pending MFA_SETUP challenge"))
      cognitoUser.associateSoftwareToken({
        associateSecretCode: (secretCode) => {
          const username = cognitoUser.getUsername()
          const otpauthUrl = `otpauth://totp/TSU:${encodeURIComponent(
            username,
          )}?secret=${secretCode}&issuer=TSU`
          resolve({ secretCode, otpauthUrl })
        },
        onFailure: (err) => reject(err),
      })
    })
  }, [])

  const verifyTotp = React.useCallback(
    (userCode: string): Promise<SignInResult> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = cognitoUserRef.current
        if (!cognitoUser)
          return reject(new Error("No pending MFA_SETUP challenge"))
        cognitoUser.verifySoftwareToken(userCode, "TSU device", {
          onSuccess: (session) => {
            adoptSession(session)
            resolve({ kind: "tokens" })
          },
          onFailure: (err) =>
            reject(new Error("Code is incorrect or expired.", { cause: err })),
        })
      })
    },
    [adoptSession],
  )

  const confirmMfa = React.useCallback(
    (code: string): Promise<SignInResult> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = cognitoUserRef.current
        if (!cognitoUser)
          return reject(new Error("No pending SOFTWARE_TOKEN_MFA challenge"))
        cognitoUser.sendMFACode(
          code,
          {
            onSuccess: (session) => {
              adoptSession(session)
              resolve({ kind: "tokens" })
            },
            onFailure: (err) =>
              reject(
                new Error("Code is incorrect or expired.", { cause: err }),
              ),
          },
          "SOFTWARE_TOKEN_MFA",
        )
      })
    },
    [adoptSession],
  )

  const forgotPassword = React.useCallback((email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      } as IAuthenticationCallback)
    })
  }, [])

  const resetPassword = React.useCallback(
    (email: string, code: string, newPassword: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => resolve(),
          onFailure: (err) => reject(err),
        })
      })
    },
    [],
  )

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
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
