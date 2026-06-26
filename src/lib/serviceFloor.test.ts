import { describe, it, expect } from "vitest"
import { isLiveOnFloor } from "./serviceFloor"
import type { Reservation, ReservationStatus } from "@/services/reservationsService"

const NOW = 12 * 60 // 12:00

function mk(status: ReservationStatus, time: string): Reservation {
  return {
    id: `r-${status}-${time}`,
    time,
    name: "Test",
    pax: 2,
    tables: ["20"],
    status,
    shift: "lunch",
    isWalkIn: false,
    vip: false,
  }
}

describe("isLiveOnFloor", () => {
  it("shows a seated reservation at any time (guests are physically there)", () => {
    expect(isLiveOnFloor(mk("seated", "20:00"), NOW)).toBe(true)
    expect(isLiveOnFloor(mk("seated", "08:00"), NOW)).toBe(true)
  })

  it("shows a booking arriving within the 60-min lookahead", () => {
    expect(isLiveOnFloor(mk("booked", "12:30"), NOW)).toBe(true) // +30
    expect(isLiveOnFloor(mk("booked", "13:00"), NOW)).toBe(true) // +60 boundary
  })

  it("hides a far-future booking", () => {
    expect(isLiveOnFloor(mk("booked", "13:01"), NOW)).toBe(false) // +61
    expect(isLiveOnFloor(mk("booked", "21:00"), NOW)).toBe(false)
  })

  it("shows an overdue booking within the 30-min grace", () => {
    expect(isLiveOnFloor(mk("booked", "11:40"), NOW)).toBe(true) // -20
    expect(isLiveOnFloor(mk("booked", "11:30"), NOW)).toBe(true) // -30 boundary
  })

  it("hides a long-overdue booking (likely a no-show that was never marked)", () => {
    expect(isLiveOnFloor(mk("booked", "11:29"), NOW)).toBe(false) // -31
    expect(isLiveOnFloor(mk("booked", "09:00"), NOW)).toBe(false)
  })

  it("hides terminal statuses (the table is free)", () => {
    expect(isLiveOnFloor(mk("completed", "12:00"), NOW)).toBe(false)
    expect(isLiveOnFloor(mk("cancelled", "12:00"), NOW)).toBe(false)
    expect(isLiveOnFloor(mk("noshow", "12:00"), NOW)).toBe(false)
  })
})
