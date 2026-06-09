import { apiFetch } from "./apiClient"
import type { UserRole } from "@/contexts/AuthContext"

/** Backend users row (snake_case). Empty table until Cognito populates it (P10b). */
interface UserRow {
  id: string
  name: string | null
  email: string
  role: UserRole
  active: boolean
  last_active_at: string | null
}

export interface StaffUser {
  id: string
  name: string | null
  email: string
  role: UserRole
  active: boolean
  lastActiveAt: string | null
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
}

export interface UserFilters {
  role?: UserRole
  search?: string
}

function adaptUser(row: UserRow): StaffUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    lastActiveAt: row.last_active_at,
  }
}

/** Live list (returns [] until Cognito seeds the users table in P10b). */
export async function listUsers(filters: UserFilters = {}): Promise<StaffUser[]> {
  const params = new URLSearchParams()
  if (filters.role) params.set("role", filters.role)
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  const qs = params.toString()
  const res = await apiFetch<UserRow[]>(`/users${qs ? `?${qs}` : ""}`)
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load staff")
  }
  return res.data.map(adaptUser)
}

export interface CreateUserResult {
  user: StaffUser
  /**
   * Temporary password to hand to the new staffer. Cognito also emails it.
   * `null` when the backend emailed a password it didn't return (pre-hybrid
   * deploy) — the modal falls back to an "invite emailed" message.
   */
  tempPassword: string | null
}

/**
 * Creates the Cognito user + staff row. Returns the temp password so the
 * manager can share it in person (it's also emailed to the staffer).
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const res = await apiFetch<{ user: UserRow; tempPassword: string | null } | UserRow>(
    "/users",
    { method: "POST", body: JSON.stringify(input) },
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Couldn't create the account.")
  }
  // New contract: { user, tempPassword }. Tolerate the older flat UserRow shape
  // until the backend hybrid deploy lands (then tempPassword is always present).
  const data = res.data
  if ("user" in data) {
    return { user: adaptUser(data.user), tempPassword: data.tempPassword ?? null }
  }
  return { user: adaptUser(data), tempPassword: null }
}

/** Stubbed until Cognito (P10b) — the backend returns 501. */
export async function patchUser(
  id: string,
  patch: Partial<CreateUserInput> & { active?: boolean },
): Promise<StaffUser> {
  const res = await apiFetch<UserRow>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  if (!res.success || !res.data) {
    throw new Error(
      res.error?.message ?? "Available after auth is wired (final phase).",
    )
  }
  return adaptUser(res.data)
}
