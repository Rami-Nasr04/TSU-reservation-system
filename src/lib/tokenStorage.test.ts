import { describe, it, expect, beforeEach } from "vitest"
import { tokenStorage } from "./tokenStorage"

describe("tokenStorage", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips refreshToken + deviceKey + deviceGroupKey", () => {
    tokenStorage.save({
      refreshToken: "r1",
      deviceKey: "d1",
      deviceGroupKey: "g1",
    })
    expect(tokenStorage.refreshToken).toBe("r1")
    expect(tokenStorage.deviceKey).toBe("d1")
    expect(tokenStorage.deviceGroupKey).toBe("g1")
  })

  it("clear() wipes every key", () => {
    tokenStorage.save({ refreshToken: "r", deviceKey: "d", deviceGroupKey: "g" })
    tokenStorage.clear()
    expect(tokenStorage.refreshToken).toBeNull()
    expect(tokenStorage.deviceKey).toBeNull()
    expect(tokenStorage.deviceGroupKey).toBeNull()
  })

  it("save() updates refreshToken without clobbering existing deviceKey", () => {
    tokenStorage.save({ refreshToken: "r1", deviceKey: "d1", deviceGroupKey: "g1" })
    tokenStorage.save({ refreshToken: "r2" })
    expect(tokenStorage.refreshToken).toBe("r2")
    expect(tokenStorage.deviceKey).toBe("d1")
    expect(tokenStorage.deviceGroupKey).toBe("g1")
  })
})
