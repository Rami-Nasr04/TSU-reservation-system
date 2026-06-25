import { describe, it, expect } from "vitest"
import { formatPhone, isPhoneValid, toE164, parseE164, COUNTRY_OPTIONS } from "./phone"

describe("formatPhone", () => {
  it("pretty-formats a US E.164", () => {
    expect(formatPhone("+12125551234")).toBe("+1 212 555 1234")
  })
  it("returns '' for empty/nullish", () => {
    expect(formatPhone("")).toBe("")
    expect(formatPhone(null)).toBe("")
    expect(formatPhone(undefined)).toBe("")
  })
  it("falls back to the raw input when unparseable", () => {
    expect(formatPhone("garbage")).toBe("garbage")
  })
})

describe("isPhoneValid", () => {
  it("treats empty/whitespace as valid (phone is optional)", () => {
    expect(isPhoneValid("")).toBe(true)
    expect(isPhoneValid("   ")).toBe(true)
  })
  it("accepts a valid E.164", () => {
    expect(isPhoneValid("+12125551234")).toBe(true)
  })
  it("rejects a too-short or junk number", () => {
    expect(isPhoneValid("+1212")).toBe(false)
    expect(isPhoneValid("garbage")).toBe(false)
  })
})

describe("toE164", () => {
  it("builds E.164 from LB national, stripping the trunk 0", () => {
    expect(toE164("LB", "03662794")).toBe("+9613662794")
  })
  it("builds E.164 from a US national number", () => {
    expect(toE164("US", "2125551234")).toBe("+12125551234")
  })
  it("returns '' when there are no digits", () => {
    expect(toE164("LB", "")).toBe("")
    expect(toE164("LB", "   ")).toBe("")
  })
})

describe("parseE164", () => {
  it("derives country + national digits from a US E.164", () => {
    const r = parseE164("+12125551234")
    expect(r.country).toBe("US")
    expect(r.national.replace(/\D/g, "")).toBe("2125551234")
  })
  it("falls back to LB + empty national for blank input", () => {
    expect(parseE164("")).toEqual({ country: "LB", national: "" })
  })
  it("falls back to LB + empty national for junk", () => {
    expect(parseE164("garbage")).toEqual({ country: "LB", national: "" })
  })
})

describe("COUNTRY_OPTIONS", () => {
  it("includes Lebanon with calling code 961", () => {
    const lb = COUNTRY_OPTIONS.find((o) => o.code === "LB")
    expect(lb).toBeDefined()
    expect(lb!.callingCode).toBe("961")
    expect(lb!.name.length).toBeGreaterThan(0)
  })
  it("is sorted by display name", () => {
    const names = COUNTRY_OPTIONS.map((o) => o.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })
})
