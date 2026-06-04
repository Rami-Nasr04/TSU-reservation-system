import { describe, it, expect, beforeEach } from "vitest"
import { tokenStorage } from "./tokenStorage"

describe("tokenStorage", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips refreshToken + deviceKey + deviceGroupKey + devicePassword", () => {
    tokenStorage.save({
      refreshToken: "r1",
      deviceKey: "d1",
      deviceGroupKey: "g1",
      devicePassword: "p1",
    })
    expect(tokenStorage.refreshToken).toBe("r1")
    expect(tokenStorage.deviceKey).toBe("d1")
    expect(tokenStorage.deviceGroupKey).toBe("g1")
    expect(tokenStorage.devicePassword).toBe("p1")
  })

  it("clear() wipes every key including device state", () => {
    tokenStorage.save({
      refreshToken: "r",
      deviceKey: "d",
      deviceGroupKey: "g",
      devicePassword: "p",
    })
    tokenStorage.clear()
    expect(tokenStorage.refreshToken).toBeNull()
    expect(tokenStorage.deviceKey).toBeNull()
    expect(tokenStorage.deviceGroupKey).toBeNull()
    expect(tokenStorage.devicePassword).toBeNull()
  })

  it("clearSession() wipes only the refresh token; device state survives", () => {
    tokenStorage.save({
      refreshToken: "r",
      deviceKey: "d",
      deviceGroupKey: "g",
      devicePassword: "p",
    })
    tokenStorage.clearSession()
    expect(tokenStorage.refreshToken).toBeNull()
    expect(tokenStorage.deviceKey).toBe("d")
    expect(tokenStorage.deviceGroupKey).toBe("g")
    expect(tokenStorage.devicePassword).toBe("p")
  })

  it("clearDevice() wipes only device state; refresh token survives", () => {
    tokenStorage.save({
      refreshToken: "r",
      deviceKey: "d",
      deviceGroupKey: "g",
      devicePassword: "p",
    })
    tokenStorage.clearDevice()
    expect(tokenStorage.refreshToken).toBe("r")
    expect(tokenStorage.deviceKey).toBeNull()
    expect(tokenStorage.deviceGroupKey).toBeNull()
    expect(tokenStorage.devicePassword).toBeNull()
  })

  it("save() updates refreshToken without clobbering existing deviceKey", () => {
    tokenStorage.save({ refreshToken: "r1", deviceKey: "d1", deviceGroupKey: "g1" })
    tokenStorage.save({ refreshToken: "r2" })
    expect(tokenStorage.refreshToken).toBe("r2")
    expect(tokenStorage.deviceKey).toBe("d1")
    expect(tokenStorage.deviceGroupKey).toBe("g1")
  })
})
