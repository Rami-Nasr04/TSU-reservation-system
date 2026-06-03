import type { UserRole } from "@/contexts/AuthContext"

/**
 * True if userGroups contains at least one role other than 'staff'.
 * False for staff-only or empty groups.
 */
export function canWrite(userGroups: UserRole[]): boolean {
  return userGroups.some((g) => g !== "staff")
}
