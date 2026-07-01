import { describe, it, expect } from "vitest"
import type { DayFeed, Reservation } from "@/services/reservationsService"
import { operationalDate, isPastDayLocked, formatTime12 } from "./dates"

function makeReservation(status: Reservation["status"]): Reservation {
  return {
    id: `r-${status}`,
    time: "20:00",
    name: "Test",
    pax: 2,
    tables: ["20"],
    status,
    shift: "afternoon",
    isWalkIn: false,
    vip: false,
  }
}

function makeFeed(date: string, reservations: Reservation[]): DayFeed {
  return {
    date,
    reservations,
    shifts: [],
    counters: { reservations: 0, guests: 0, walkIns: 0, seated: 0 },
  }
}

describe("operationalDate", () => {
  it("returns yesterday's date when called at 04:59 (still in last night's shift)", () => {
    const at0459 = new Date(2026, 4, 25, 4, 59, 0)
    expect(operationalDate(at0459)).toBe("2026-05-24")
  })

  it("returns today's date when called at 05:00 (shift cutover)", () => {
    const at0500 = new Date(2026, 4, 25, 5, 0, 0)
    expect(operationalDate(at0500)).toBe("2026-05-25")
  })

  it("returns today's date for any time after 05:00", () => {
    const at1430 = new Date(2026, 4, 25, 14, 30, 0)
    expect(operationalDate(at1430)).toBe("2026-05-25")
  })

  it("handles month rollover (01 May 04:30 -> 30 Apr)", () => {
    const at0430 = new Date(2026, 4, 1, 4, 30, 0)
    expect(operationalDate(at0430)).toBe("2026-04-30")
  })
})

describe("isPastDayLocked", () => {
  const now = new Date(2026, 4, 25, 14, 0, 0) // 2026-05-25 14:00 (operational = 2026-05-25)

  it("returns true for a past date when no feed is provided", () => {
    expect(isPastDayLocked("2026-05-20", undefined, now)).toBe(true)
    expect(isPastDayLocked("2026-05-20", null, now)).toBe(true)
  })

  it("returns true for a past date when the feed has no seated reservations", () => {
    const feed = makeFeed("2026-05-24", [
      makeReservation("completed"),
      makeReservation("cancelled"),
    ])
    expect(isPastDayLocked("2026-05-24", feed, now)).toBe(true)
  })

  it("returns false for a past date when at least one reservation is still seated", () => {
    const feed = makeFeed("2026-05-24", [
      makeReservation("completed"),
      makeReservation("seated"),
    ])
    expect(isPastDayLocked("2026-05-24", feed, now)).toBe(false)
  })

  it("returns false for the operational-today date regardless of feed", () => {
    expect(isPastDayLocked("2026-05-25", undefined, now)).toBe(false)
    expect(isPastDayLocked("2026-05-25", null, now)).toBe(false)
    const emptyFeed = makeFeed("2026-05-25", [])
    expect(isPastDayLocked("2026-05-25", emptyFeed, now)).toBe(false)
  })

  it("returns false for a future date", () => {
    expect(isPastDayLocked("2026-05-30", undefined, now)).toBe(false)
  })

  it("treats yesterday as not-past when called at 03:00 with a seated row from yesterday", () => {
    const at0300 = new Date(2026, 4, 25, 3, 0, 0) // operational = 2026-05-24
    const feed = makeFeed("2026-05-24", [makeReservation("seated")])
    expect(isPastDayLocked("2026-05-24", feed, at0300)).toBe(false)
  })
})

describe("formatTime12", () => {
  it("drops :00 on whole hours", () => {
    expect(formatTime12("15:00")).toBe("3pm")
    expect(formatTime12("09:00")).toBe("9am")
  })
  it("keeps minutes on non-whole hours", () => {
    expect(formatTime12("19:30")).toBe("7:30pm")
    expect(formatTime12("12:15")).toBe("12:15pm")
  })
  it("handles noon and midnight", () => {
    expect(formatTime12("12:00")).toBe("12pm")
    expect(formatTime12("00:00")).toBe("12am")
    expect(formatTime12("00:30")).toBe("12:30am")
  })
  it("handles last seating and close", () => {
    expect(formatTime12("23:00")).toBe("11pm")
  })
  it("accepts an unpadded hour", () => {
    expect(formatTime12("9:00")).toBe("9am")
  })
})
