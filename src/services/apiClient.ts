const BASE_URL = import.meta.env.VITE_API_URL ?? ""

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

// Per-URL mock fallback. Add a path prefix here to force a service back to its
// in-memory mock generator instead of hitting the live API.
// Pattern reference: KJ-77/Way src/Hooks/useFetch.js — shouldUseMock(url).
// Entries are path PREFIXES, not regexes: `'/reservations'` matches
// `/reservations`, `/reservations/{id}`, and `/reservations?date=...`.
export const MOCK_ENDPOINTS: string[] = []

export const shouldUseMock = (path: string): boolean =>
  MOCK_ENDPOINTS.some((p) => path.startsWith(p))

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
    const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined ?? {}) }
    if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
    const body = (await res.json()) as ApiResponse<T>
    return body
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: { code: "NETWORK", message } }
  }
}
