import { hhmmToMinutes, operationalDate } from "./dates"
import type { DayFeed, Reservation } from "@/services/reservationsService"

const IMMINENT_BUFFER_MIN = 15

export type AvailabilityResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * Frontend pre-flight check before sending a merge reservation. There is NO
 * backend overlap guard (no exclusion constraint ever existed), so this is the
 * only overlap check in the system — it surfaces a friendly toast before a merge
 * would double-book a table.
 *
 * Rules:
 *  - Operational-past dates: skip — past-day edits go through the locked branch.
 *  - Turn-bearing rows (the late-dinner grid) are exempt — turns are host-managed
 *    and may share a table/turn freely.
 *  - For each sibling table in the merge set, scan the day feed for any
 *    reservation already holding it (excluding the row being edited):
 *      * If `seated` and the start time is within {@link IMMINENT_BUFFER_MIN}
 *        minutes of `startTime`, that seat is hot — reject.
 *      * If `booked` at the same time, reject (overlap).
 *      * If `seated` but the new start is well past the buffer, allow.
 *  - Completed / cancelled / noshow rows never block (cells are free).
 */
export function checkMergeAvailability(
  date: string,
  startTime: string,
  tablesToMerge: string[],
  feed: DayFeed | null,
  now: Date = new Date(),
  excludeReservationId?: string,
): AvailabilityResult {
  if (!feed || tablesToMerge.length === 0) return { ok: true }
  if (date < operationalDate(now)) return { ok: true }

  const startMins = hhmmToMinutes(startTime)
  const tableSet = new Set(tablesToMerge)

  for (const r of feed.reservations) {
    if (r.id === excludeReservationId) continue
    if (r.turn != null) continue // turn rows are host-managed — never block
    if (r.status !== "seated" && r.status !== "booked") continue
    const overlap = r.tables.find((t) => tableSet.has(t))
    if (!overlap) continue

    if (r.status === "seated") {
      const seatedSinceMins = hhmmToMinutes(r.time)
      if (startMins - seatedSinceMins < IMMINENT_BUFFER_MIN) {
        return {
          ok: false,
          reason: `Table ${overlap} is currently seated — pick a start time at least ${IMMINENT_BUFFER_MIN} minutes from now.`,
        }
      }
      continue
    }

    // booked
    if (hhmmToMinutes(r.time) === startMins) {
      return {
        ok: false,
        reason: `Table ${overlap} is already booked at ${r.time}.`,
      }
    }
  }

  return { ok: true }
}

/** Re-exported for tests / consumers that want to advertise the rule. */
export const MERGE_IMMINENT_BUFFER_MIN = IMMINENT_BUFFER_MIN
export type { Reservation }
