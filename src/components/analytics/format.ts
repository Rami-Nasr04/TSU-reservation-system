import type { AnalyticsRange } from "@/services/analyticsService"

/** USD whole-dollar amount, e.g. `$12,640`. Currency locked to USD for v1. */
export function formatCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

/** Plain integer with thousands separators. */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US")
}

/** Signed one-decimal percent, e.g. `+11.7%` / `-4.0%`. */
export function formatDelta(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export interface RangeOption {
  value: Extract<AnalyticsRange, string>
  label: string
}

export const RANGE_OPTIONS: RangeOption[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last30", label: "Last 30 days" },
]

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Mon-first day index (0=Mon … 6=Sun). */
function isoDayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

/**
 * Human label for the resolved window, mirroring the backend's `rangeToInterval`
 * (week = ISO-Monday → today; month = month-to-date; last30 = today-29 → today).
 * Shown as the muted sub-label next to the range picker.
 */
export function rangeDateLabel(range: AnalyticsRange): string {
  if (typeof range !== "string") {
    return `${range.from} – ${range.to}`
  }
  const today = new Date()
  switch (range) {
    case "today":
      return shortDate(today)
    case "week": {
      const monday = new Date(today)
      monday.setDate(today.getDate() - isoDayIndex(today))
      return `${shortDate(monday)} – ${shortDate(today)}`
    }
    case "month":
      return today.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    case "last30": {
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      return `${shortDate(start)} – ${shortDate(today)}`
    }
  }
}
