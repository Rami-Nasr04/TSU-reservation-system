import { hhmmToMinutes } from "@/lib/dates"
import type { Reservation } from "@/services/reservationsService"

/** A booking starts tying up its table this many minutes before arrival. */
export const LIVE_LOOKAHEAD_MIN = 60
/** An overdue (not-yet-seated) booking keeps showing this long, then drops off. */
export const LIVE_OVERDUE_GRACE_MIN = 30

/**
 * Is this reservation occupying — or about to occupy — a table *right now*?
 * Shared by Service Mode's live floor and the "Empty tables" KPI so they agree
 * (the live view answers "is this table free right now", not "sometime today").
 *  - seated → always (guests are physically there, whatever shift they started in)
 *  - booked → only when arrival is imminent (≤ {@link LIVE_LOOKAHEAD_MIN} ahead)
 *    or just overdue (≤ {@link LIVE_OVERDUE_GRACE_MIN} past). Far-future and
 *    long-overdue bookings don't tie up the table on a live view.
 *  - completed / cancelled / noshow → no (the table is free)
 */
export function isLiveOnFloor(r: Reservation, nowMin: number): boolean {
  if (r.status === "seated") return true
  if (r.status === "booked") {
    const start = hhmmToMinutes(r.time)
    return start <= nowMin + LIVE_LOOKAHEAD_MIN && start >= nowMin - LIVE_OVERDUE_GRACE_MIN
  }
  return false
}
