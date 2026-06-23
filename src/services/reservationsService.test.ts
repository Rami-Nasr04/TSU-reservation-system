import { describe, it, expect } from "vitest"
import { bucketShift } from "./reservationsService"

describe("bucketShift — new shift windows (Lunch 12–2 / Afternoon 2–7 / Late 7–close)", () => {
  it("buckets lunch up to 13:59", () => {
    expect(bucketShift("12:00")).toBe("lunch")
    expect(bucketShift("13:59")).toBe("lunch")
  })
  it("buckets afternoon 14:00–18:59", () => {
    expect(bucketShift("14:00")).toBe("afternoon")
    expect(bucketShift("18:59")).toBe("afternoon")
  })
  it("buckets late dinner from 19:00", () => {
    expect(bucketShift("19:00")).toBe("late")
    expect(bucketShift("20:59")).toBe("late")
    expect(bucketShift("23:00")).toBe("late")
  })
})
