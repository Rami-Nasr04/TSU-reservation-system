import * as React from "react"

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

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null
  userAttributes: UserAttributes | null
  userGroups: UserRole[]
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * STUB implementation — Cognito wiring lives in a follow-up task.
 * Hook into `@aws-amplify/auth` here once the User Pool is provisioned.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [userAttributes, setUserAttributes] =
    React.useState<UserAttributes | null>(null)
  const [userGroups, setUserGroups] = React.useState<UserRole[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const signIn = React.useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (password === "wrong" || password.length < 6) {
        throw new Error("Email or password incorrect.")
      }
      const stubUser: AuthUser = {
        id: "stub-user",
        email,
        name: email.split("@")[0],
      }
      setUser(stubUser)
      setUserAttributes({ email, name: stubUser.name, sub: stubUser.id })
      setUserGroups(["manager"])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    setUser(null)
    setUserAttributes(null)
    setUserGroups([])
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
      signIn,
      signOut,
      hasRole,
    }),
    [user, userAttributes, userGroups, isLoading, signIn, signOut, hasRole],
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
