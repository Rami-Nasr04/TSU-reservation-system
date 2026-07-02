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

/** Today as a YYYY-MM-DD string (local time). */
export function todayISO(): string {
  const t = todayParts()
  return formatDateISO(t.year, t.month0, t.day)
}

/** True when `iso` (YYYY-MM-DD) is strictly before today (local). */
export function isPastDate(iso: string): boolean {
  return iso < todayISO()
}

const SHIFT_CUTOFF_HOUR = 5

/**
 * The date the restaurant currently considers "today" for operational purposes.
 * Before 5 AM, the host is still working last night's shift, so this returns
 * yesterday's calendar date. From 5 AM onward, today's calendar date.
 */
export function operationalDate(now: Date = new Date()): string {
  const ref = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() < SHIFT_CUTOFF_HOUR) {
    ref.setDate(ref.getDate() - 1)
  }
  return formatDateISO(ref.getFullYear(), ref.getMonth(), ref.getDate())
}

/**
 * Is `date` past for editability purposes?
 *   - `date >= operationalDate(now)` → not past (editable)
 *   - `date < operationalDate(now)` AND `feed` has any seated reservation → not past
 *   - otherwise → past (view-only)
 *
 * `feed` may be omitted (e.g. in Calendar before the day is loaded); in that
 * case a past date is treated as locked since we have no info to say otherwise.
 */
export function isPastDayLocked(
  date: string,
  feed?: { reservations: { status: string }[] } | null,
  now: Date = new Date(),
): boolean {
  if (date >= operationalDate(now)) return false
  if (!feed) return true
  return feed.reservations.every((r) => r.status !== "seated")
}

/** True when `iso` (YYYY-MM-DD) is today (local). */
export function isToday(iso: string): boolean {
  return iso === todayISO()
}

/** True when `iso` (YYYY-MM-DD) is strictly after today (local). */
export function isFutureDate(iso: string): boolean {
  return iso > todayISO()
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

/** Current local time rounded down to the nearest 15-min slot, as "HH:mm". */
export function nowRounded15(): string {
  const d = new Date()
  const h = d.getHours()
  const m = Math.floor(d.getMinutes() / 15) * 15
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Reservation time slots from 12:00 to 23:00 in 15-min steps (last seating 11:00pm). */
export function reservationTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 12; h <= 23; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return slots
}

/** Shift a YYYY-MM-DD by N days, returning a new YYYY-MM-DD. */
export function shiftDateISO(iso: string, deltaDays: number): string {
  const parts = parseDateISO(iso)
  if (!parts) return iso
  const d = new Date(parts.year, parts.month0, parts.day + deltaDays)
  return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate())
}

/** "HH:mm" → minutes since midnight. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Current local time as minutes since midnight. */
export function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Compact duration label: 138 → "2h 18m", 48 → "48m", ≤0 → "0m". */
export function formatDurationShort(mins: number): string {
  const clamped = Math.max(0, Math.round(mins))
  if (clamped === 0) return "0m"
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Display-only 12-hour label from canonical 24h "HH:mm".
 * Whole hours drop the minutes ("15:00" → "3pm"); otherwise keep them
 * ("19:30" → "7:30pm"). Lowercase am/pm, no space. Storage stays 24h.
 */
export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":")
  const h = Number(hStr)
  const m = Number(mStr)
  const ap = h < 12 ? "am" : "pm"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, "0")}${ap}`
}
