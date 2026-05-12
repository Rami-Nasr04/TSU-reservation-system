const BASE_URL = import.meta.env.VITE_API_URL ?? ""

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  if (!BASE_URL) {
    return {
      success: false,
      error: "VITE_API_URL not configured — using mock services.",
    }
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    })
    const body = (await res.json()) as ApiResponse<T>
    return body
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, error: message }
  }
}
