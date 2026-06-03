import { describe, it, expect } from "vitest"
import { canWrite } from "./auth"
import type { UserRole } from "@/contexts/AuthContext"

describe("canWrite", () => {
  it("returns false for empty groups", () => {
    expect(canWrite([])).toBe(false)
  })
  it("returns false for staff-only", () => {
    expect(canWrite(["staff"])).toBe(false)
  })
  it("returns true for host", () => {
    expect(canWrite(["host"])).toBe(true)
  })
  it("returns true for supervisor", () => {
    expect(canWrite(["supervisor"])).toBe(true)
  })
  it("returns true for manager combined with staff", () => {
    expect(canWrite(["manager", "staff"] as UserRole[])).toBe(true)
  })
})
