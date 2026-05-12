import type { Reservation } from "@/services/reservationsService"

export type CellState = "free" | "booked" | "seated" | "completed"

/** Resolve the visual state for a table cell from the day's reservations. */
export function deriveCellState(
  tableId: string,
  reservations: Reservation[],
): { state: CellState; resv?: Reservation } {
  const onTable = reservations.filter(
    (r) => r.tables.includes(tableId) && r.status !== "cancelled" && r.status !== "noshow",
  )
  if (onTable.length === 0) return { state: "free" }
  const seated = onTable.find((r) => r.status === "seated")
  if (seated) return { state: "seated", resv: seated }
  const booked = onTable
    .filter((r) => r.status === "booked")
    .sort((a, b) => a.time.localeCompare(b.time))[0]
  if (booked) return { state: "booked", resv: booked }
  return { state: "completed", resv: onTable[onTable.length - 1] }
}
