import { describe, it, expect } from "vitest"
import type { DayFeed, Reservation } from "@/services/reservationsService"
import { checkMergeAvailability } from "./reservationConflicts"

function makeReservation(
  overrides: Partial<Reservation> & Pick<Reservation, "id" | "status" | "tables" | "time">,
): Reservation {
  return {
    name: "Test",
    pax: 2,
    shift: "afternoon",
    isWalkIn: false,
    vip: false,
    ...overrides,
  }
}

function makeFeed(reservations: Reservation[]): DayFeed {
  return {
    date: "2026-05-26",
    reservations,
    shifts: [],
    counters: { reservations: 0, guests: 0, walkIns: 0, seated: 0 },
  }
}

const today = "2026-05-26"
const at1500 = new Date(2026, 4, 26, 15, 0, 0)

describe("checkMergeAvailability", () => {
  it("returns ok when no merge tables are picked", () => {
    expect(
      checkMergeAvailability(today, "19:00", [], makeFeed([]), at1500),
    ).toEqual({ ok: true })
  })

  it("returns ok when the feed is null", () => {
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], null, at1500),
    ).toEqual({ ok: true })
  })

  it("returns ok when all siblings are free", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "seated", tables: ["30"], time: "14:00" }),
    ])
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500),
    ).toEqual({ ok: true })
  })

  it("returns ok for a far-future booking when the conflict is a current walk-in (well past buffer)", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "seated", tables: ["22"], time: "14:00", isWalkIn: true }),
    ])
    // 19:00 start vs 14:00 seated since = 5 hours apart, well past 15-min buffer
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500),
    ).toEqual({ ok: true })
  })

  it("rejects when start is within 15-min buffer of a seated sibling", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "seated", tables: ["22"], time: "14:50", isWalkIn: true }),
    ])
    // 15:00 start vs 14:50 seated since = 10 min apart, inside 15-min buffer
    const result = checkMergeAvailability(today, "15:00", ["20", "22"], feed, at1500)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/Table 22 is currently seated/)
    }
  })

  it("rejects when a sibling is booked at the same start time", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "booked", tables: ["22"], time: "19:00" }),
    ])
    const result = checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/already booked at 19:00/)
    }
  })

  it("ignores cancelled / noshow / completed siblings", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "cancelled", tables: ["22"], time: "19:00" }),
      makeReservation({ id: "r2", status: "noshow", tables: ["22"], time: "19:00" }),
      makeReservation({ id: "r3", status: "completed", tables: ["22"], time: "19:00" }),
    ])
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500),
    ).toEqual({ ok: true })
  })

  it("excludes the reservation being edited from the conflict scan", () => {
    const feed = makeFeed([
      makeReservation({ id: "self", status: "booked", tables: ["20", "22"], time: "19:00" }),
    ])
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500, "self"),
    ).toEqual({ ok: true })
  })

  it("skips the check entirely for past operational dates (locked branch handles it)", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "booked", tables: ["22"], time: "19:00" }),
    ])
    expect(
      checkMergeAvailability("2026-05-20", "19:00", ["20", "22"], feed, at1500),
    ).toEqual({ ok: true })
  })

  it("does not block a turn-bearing sibling (host discretion — turns own overlap)", () => {
    const feed = makeFeed([
      makeReservation({ id: "r1", status: "booked", tables: ["22"], time: "19:00", turn: 1 }),
    ])
    // Same table + same start time would normally reject, but turn rows are exempt.
    expect(
      checkMergeAvailability(today, "19:00", ["20", "22"], feed, at1500),
    ).toEqual({ ok: true })
  })
})
