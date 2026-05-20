import type { CustomerWithStats } from "@/services/customersService"

/** Shared 6-column grid template for the desktop customer table (header + rows). */
export const CUSTOMER_GRID = "grid-cols-[2fr_1.2fr_0.7fr_0.9fr_0.9fr_0.4fr]"

/** Up-to-two-letter initials from a name; falls back to "?" for blank names. */
export function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

/** Bare-$ money formatting — matches CheckoutDialog until the USD/LBP question is resolved. */
export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—"
  return `$${Math.round(value).toLocaleString()}`
}

/** Loyalty tier from completed-visit count (design: Gold ≥10, Silver ≥5, else New). */
export function loyaltyTier(visitCount: number): "Gold" | "Silver" | "New" {
  if (visitCount >= 10) return "Gold"
  if (visitCount >= 5) return "Silver"
  return "New"
}

/** Short "Mon D, YYYY" label from a YYYY-MM-DD string (no Date parse → no TZ drift). */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
export function formatDayLabel(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** Display name with an anonymous fallback. */
export function displayName(c: Pick<CustomerWithStats, "name">): string {
  return c.name?.trim() || "Unnamed guest"
}
