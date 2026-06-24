import { describe, it, expect } from "vitest"
import { deriveCellState } from "./cellState"
import type { Reservation } from "@/services/reservationsService"

function resv(over: Partial<Reservation>): Reservation {
  return {
    id: "r",
    time: "20:00",
    name: "Guest",
    pax: 2,
    tables: ["20"],
    status: "booked",
    shift: "late",
    isWalkIn: false,
    vip: false,
    ...over,
  }
}

describe("deriveCellState turn-awareness", () => {
  const rs = [
    resv({ id: "a", tables: ["20"], turn: 1, status: "booked", time: "19:30" }),
    resv({ id: "b", tables: ["20"], turn: 2, status: "seated", time: "20:30" }),
  ]

  it("without a turn arg, behaves table-wide (seated wins regardless of turn)", () => {
    expect(deriveCellState("20", rs).state).toBe("seated")
  })

  it("turn 1 cell sees only the turn-1 reservation", () => {
    const r = deriveCellState("20", rs, 1)
    expect(r.state).toBe("booked")
    expect(r.resv?.id).toBe("a")
  })

  it("turn 2 cell sees only the turn-2 reservation", () => {
    const r = deriveCellState("20", rs, 2)
    expect(r.state).toBe("seated")
    expect(r.resv?.id).toBe("b")
  })

  it("turn 3 cell is free", () => {
    expect(deriveCellState("20", rs, 3).state).toBe("free")
  })
})
