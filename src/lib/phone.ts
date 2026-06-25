import {
  AsYouType,
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js"

const DEFAULT_COUNTRY: CountryCode = "LB"

/** Pretty international from a stored E.164. "" → ""; unparseable → the raw input. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return ""
  try {
    const parsed = parsePhoneNumber(e164)
    if (parsed) return parsed.formatInternational()
  } catch {
    /* fall through to raw */
  }
  return e164
}

/** Soft validity: empty/whitespace is always valid (phone is optional). */
export function isPhoneValid(e164: string): boolean {
  if (!e164.trim()) return true
  try {
    return isValidPhoneNumber(e164)
  } catch {
    return false
  }
}

/** Best-effort canonical E.164 from a country + raw national text. "" when no digits. */
export function toE164(country: CountryCode, rawNational: string): string {
  const digits = rawNational.replace(/\D/g, "")
  if (!digits) return ""
  const ayt = new AsYouType(country)
  ayt.input(rawNational)
  const num = ayt.getNumber()
  if (num) return num.number
  // Parser has no number yet (incomplete): prefix the calling code onto the raw digits.
  return `+${getCountryCallingCode(country)}${digits}`
}

/** Seed a PhoneField from a stored E.164 → { country, national } (formatted national). */
export function parseE164(
  e164: string,
  fallbackCountry: CountryCode = DEFAULT_COUNTRY,
): { country: CountryCode; national: string } {
  if (e164) {
    try {
      const parsed = parsePhoneNumber(e164)
      if (parsed?.country) {
        return { country: parsed.country, national: parsed.formatNational() }
      }
    } catch {
      /* fall through to fallback */
    }
  }
  return { country: fallbackCountry, national: "" }
}

export interface CountryOption {
  code: CountryCode
  name: string
  callingCode: string
}

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" })

/** All ISO regions libphonenumber knows, named + dial-coded, sorted by name. Built once. */
export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: REGION_NAMES.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
