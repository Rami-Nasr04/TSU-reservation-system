import type { ShiftId } from "@/services/reservationsService"
import type { TableSection } from "@/lib/tables"

export type TurnId = 1 | 2 | 3

export interface TurnDef {
  id: TurnId
  /** Short column label, e.g. "7–9". */
  label: string
  startMin: number
  endMin: number
}

/**
 * Turns enabled per shift. Only late dinner uses turns for now — add entries to
 * extend turns to other shifts later (a config change, not a logic change).
 * Windows intentionally overlap (7–9 / 8–10 / 9–11); a table turns over across them.
 */
const SHIFT_TURNS: Partial<Record<ShiftId, TurnDef[]>> = {
  late: [
    { id: 1, label: "7–9", startMin: 19 * 60, endMin: 21 * 60 },
    { id: 2, label: "8–10", startMin: 20 * 60, endMin: 22 * 60 },
    { id: 3, label: "9–11", startMin: 21 * 60, endMin: 23 * 60 },
  ],
}

export function turnsForShift(shift: ShiftId): TurnDef[] {
  return SHIFT_TURNS[shift] ?? []
}

/**
 * Default turn for a start time = the latest turn that has started by then.
 * Returns null for shifts without turns. The windows overlap, so this is only a
 * default — the host can override in the picker.
 */
export function defaultTurnForTime(shift: ShiftId, timeHHmm: string): TurnId | null {
  const turns = turnsForShift(shift)
  if (turns.length === 0) return null
  const [h, m] = timeHHmm.split(":").map(Number)
  const t = h * 60 + m
  const started = turns.filter((x) => x.startMin <= t)
  return (started.length ? started[started.length - 1] : turns[0]).id
}

/** Cell label suffix: turn 1 = "" (#20), turn 2 = "a" (#20a), turn 3 = "b" (#20b). */
export function turnLabelSuffix(turn: TurnId): "" | "a" | "b" {
  return turn === 1 ? "" : turn === 2 ? "a" : "b"
}

/** Frontend rule: turns apply only to the Indoor section during Late dinner. */
export function usesTurns(section: TableSection, shift: ShiftId): boolean {
  return section === "indoor" && shift === "late"
}
