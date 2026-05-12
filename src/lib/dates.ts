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
