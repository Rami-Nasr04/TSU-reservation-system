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

/**
 * Stubbed until Cognito (P10b) — the backend returns 501. The error message is
 * surfaced to the user as a toast from the Add staff modal.
 */
export async function createUser(input: CreateUserInput): Promise<StaffUser> {
  const res = await apiFetch<UserRow>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.success || !res.data) {
    throw new Error(
      res.error?.message ?? "Available after auth is wired (final phase).",
    )
  }
  return adaptUser(res.data)
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
