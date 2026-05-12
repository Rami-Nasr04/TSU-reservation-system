/** ISO month label e.g. "May 2026". */
export function monthLabel(year: number, month0: number): string {
  return new Date(year, month0, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

/** Days in the given month. month0 is 0-indexed (Jan=0). */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** Weekday of the 1st of the month. 0=Sun … 6=Sat. */
export function firstWeekdayOfMonth(year: number, month0: number): number {
  return new Date(year, month0, 1).getDay()
}

/** Weekday of an arbitrary day in a month. 0=Sun … 6=Sat. */
export function dayOfWeek(year: number, month0: number, day: number): number {
  return new Date(year, month0, day).getDay()
}

/**
 * Number of leading blank cells before day 1 in a Mon-first grid.
 * Sunday is the LAST column.
 */
export function mondayFirstLeadIn(firstWeekday: number): number {
  return (firstWeekday + 6) % 7
}

/** YYYY-MM-DD for the given local date (no time-zone math). */
export function formatDateISO(year: number, month0: number, day: number): string {
  const mm = String(month0 + 1).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

/** Returns { year, month0, day } for `new Date()` in local time. */
export function todayParts(): { year: number; month0: number; day: number } {
  const d = new Date()
  return { year: d.getFullYear(), month0: d.getMonth(), day: d.getDate() }
}

/** Shift a (year, month0) by N months, returning the new pair. */
export function shiftMonth(
  year: number,
  month0: number,
  delta: number,
): { year: number; month0: number } {
  const d = new Date(year, month0 + delta, 1)
  return { year: d.getFullYear(), month0: d.getMonth() }
}

/** Parse YYYY-MM-DD into local-date parts. Returns null if invalid. */
export function parseDateISO(
  iso: string,
): { year: number; month0: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const year = Number(m[1])
  const month0 = Number(m[2]) - 1
  const day = Number(m[3])
  if (month0 < 0 || month0 > 11) return null
  const d = new Date(year, month0, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month0 ||
    d.getDate() !== day
  ) {
    return null
  }
  return { year, month0, day }
}

/** "Tue, May 12" style label for the day stepper. */
export function dayLabel(year: number, month0: number, day: number): string {
  return new Date(year, month0, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/** "MAY 2026" style label for the back-link to the calendar (upper-cased). */
export function monthLinkLabel(year: number, month0: number): string {
  return new Date(year, month0, 1)
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase()
}

/** Shift a YYYY-MM-DD by N days, returning a new YYYY-MM-DD. */
export function shiftDateISO(iso: string, deltaDays: number): string {
  const parts = parseDateISO(iso)
  if (!parts) return iso
  const d = new Date(parts.year, parts.month0, parts.day + deltaDays)
  return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate())
}
