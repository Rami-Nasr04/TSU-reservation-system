import type { Reservation } from "@/services/reservationsService"

export type CellState = "free" | "booked" | "seated" | "completed"

/**
 * Resolve the visual state for a table cell from the day's reservations.
 * Pass `turn` for the late-dinner turn grid — the cell then only counts
 * reservations in that turn (so #20, #20a, #20b resolve independently).
 */
export function deriveCellState(
  tableId: string,
  reservations: Reservation[],
  turn?: 1 | 2 | 3,
): { state: CellState; resv?: Reservation } {
  const onTable = reservations.filter(
    (r) => r.tables.includes(tableId) && (turn == null || r.turn === turn),
  )
  const seated = onTable.find((r) => r.status === "seated")
  if (seated) return { state: "seated", resv: seated }
  const booked = onTable
    .filter((r) => r.status === "booked")
    .sort((a, b) => a.time.localeCompare(b.time))[0]
  if (booked) return { state: "booked", resv: booked }
  return { state: "free" }
}
