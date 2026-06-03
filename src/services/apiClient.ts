import { getIdToken, tryRefresh, onAuthFailure } from "@/lib/authBridge"

const BASE_URL = import.meta.env.VITE_API_URL ?? ""

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export const MOCK_ENDPOINTS: string[] = []

export const shouldUseMock = (path: string): boolean =>
  MOCK_ENDPOINTS.some((p) => path.startsWith(p))

interface InternalInit extends RequestInit {
  _noRetry?: boolean
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
  const internal = (init ?? {}) as InternalInit
  try {
    const method = (internal.method ?? "GET").toUpperCase()
    const headers: Record<string, string> = {
      ...((internal.headers as Record<string, string> | undefined) ?? {}),
    }
    if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }
    const idToken = getIdToken()
    if (idToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${idToken}`
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...internal, headers })

    if (res.status === 401 && idToken && !internal._noRetry) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        return apiFetch<T>(path, {
          ...internal,
          _noRetry: true,
        } as InternalInit)
      }
      onAuthFailure()
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in." },
      }
    }
    return (await res.json()) as ApiResponse<T>
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: { code: "NETWORK", message } }
  }
}
