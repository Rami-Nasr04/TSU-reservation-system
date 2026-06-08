import { userPool } from "@/lib/cognito"
import type { CognitoUserSession } from "amazon-cognito-identity-js"

const BASE_URL = import.meta.env.VITE_API_URL ?? ""

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export const MOCK_ENDPOINTS: string[] = []
export const shouldUseMock = (path: string): boolean =>
  MOCK_ENDPOINTS.some((p) => path.startsWith(p))

// Resolves to a valid ID token JWT, automatically refreshing via the lib if
// the cached one expired. Returns null if there's no user session at all.
function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null)
      resolve(session.getIdToken().getJwtToken())
    })
  })
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  if (!BASE_URL) {
    return {
      success: false,
      error: {
        code: "CONFIG",
        message: "VITE_API_URL not configured — using mock services.",
      },
    }
  }
  try {
    const method = (init?.method ?? "GET").toUpperCase()
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    }
    if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }
    const token = await getIdToken()
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
    if (res.status === 401) {
      // getSession() already attempted refresh and returned a valid token if
      // possible; a 401 here means the session is gone for good. Sign out so
      // ProtectedRoute kicks the user back to /login.
      const user = userPool.getCurrentUser()
      user?.signOut()
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Session expired. Please sign in.",
        },
      }
    }
    return (await res.json()) as ApiResponse<T>
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: { code: "NETWORK", message } }
  }
}
