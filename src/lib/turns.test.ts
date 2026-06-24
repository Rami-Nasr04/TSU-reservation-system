import { describe, it, expect } from "vitest"
import { turnsForShift, defaultTurnForTime, turnLabelSuffix, usesTurns } from "./turns"

describe("turns", () => {
  it("late dinner has 3 turns; other shifts none", () => {
    expect(turnsForShift("late").map((t) => t.id)).toEqual([1, 2, 3])
    expect(turnsForShift("lunch")).toEqual([])
    expect(turnsForShift("afternoon")).toEqual([])
  })

  it("defaultTurnForTime picks the latest turn that has started", () => {
    expect(defaultTurnForTime("late", "19:30")).toBe(1)
    expect(defaultTurnForTime("late", "20:30")).toBe(2)
    expect(defaultTurnForTime("late", "21:30")).toBe(3)
    expect(defaultTurnForTime("late", "23:00")).toBe(3)
    expect(defaultTurnForTime("lunch", "13:00")).toBeNull()
  })

  it("label suffix: turn 1 none, 2 a, 3 b", () => {
    expect(turnLabelSuffix(1)).toBe("")
    expect(turnLabelSuffix(2)).toBe("a")
    expect(turnLabelSuffix(3)).toBe("b")
  })

  it("usesTurns only for indoor + late", () => {
    expect(usesTurns("indoor", "late")).toBe(true)
    expect(usesTurns("indoor", "lunch")).toBe(false)
    expect(usesTurns("bar", "late")).toBe(false)
    expect(usesTurns("terrace", "late")).toBe(false)
  })
})
