import { apiFetch, shouldUseMock } from "./apiClient"

export interface CustomerLookupResult {
  name: string
  email: string
  vip: boolean
  visitCount: number
}

export interface Customer {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  vip: boolean
  notes: string | null
}

export interface CustomerInput {
  name: string | null
  phone: string | null
  email: string | null
  vip: boolean
}

// Backend shape from GET /customers/lookup (CustomerRow + visit_count).
interface CustomerLookupRow {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  vip: boolean
  visit_count: number
}

const E164 = /^\+[1-9]\d{1,14}$/

/**
 * P1 stopgap. The backend validates phone as strict E.164 and 400s otherwise.
 * Here we strip common separators and only forward the value if it's already
 * E.164 — anything else degrades to null (customer saved without a phone, lookup
 * just won't match) rather than failing the whole reservation. The canonical
 * phone format (store E.164 vs display-local) is parked to P3 per spec open
 * question #2; replace this with real parsing then.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/[\s\-.()]/g, "")
  return E164.test(cleaned) ? cleaned : null
}

function emptyToNull(v: string | null | undefined): string | null {
  const t = v?.trim()
  return t ? t : null
}

/**
 * Repeat-customer auto-fill by phone. Returns null when there's no match (normal
 * flow, not an error). Flip back to the mock by adding '/customers/lookup' to
 * MOCK_ENDPOINTS.
 */
export async function lookupCustomer(
  phone: string,
): Promise<CustomerLookupResult | null> {
  if (shouldUseMock("/customers/lookup")) return mockLookup(phone)
  const normalized = normalizePhone(phone)
  if (!normalized) return null // backend would 400 on a non-E.164 phone
  const res = await apiFetch<CustomerLookupRow | null>(
    `/customers/lookup?phone=${encodeURIComponent(normalized)}`,
  )
  if (!res.success) throw new Error(res.error?.message ?? "Lookup failed")
  const row = res.data
  if (!row) return null
  return {
    name: row.name ?? "",
    email: row.email ?? "",
    vip: row.vip,
    visitCount: row.visit_count,
  }
}

/**
 * Create-or-update a customer. POST /customers is an upsert on phone, so this is
 * idempotent: posting the same phone again updates the existing row. A null phone
 * always inserts a fresh row (anonymous). Empty name/email coerce to null since
 * the backend rejects "" for those fields.
 */
export async function upsertCustomer(input: CustomerInput): Promise<Customer> {
  const res = await apiFetch<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: emptyToNull(input.name),
      phone: normalizePhone(input.phone),
      email: emptyToNull(input.email),
      vip: input.vip,
    }),
  })
  if (!res.success || !res.data) throw new Error(res.error?.message ?? "Save failed")
  return res.data
}

async function mockLookup(phone: string): Promise<CustomerLookupResult | null> {
  await new Promise((r) => setTimeout(r, 180))
  const normalized = phone.replace(/[\s\-.()]/g, "")
  const mock: Record<string, Omit<CustomerLookupResult, "visitCount">> = {
    "03662794": { name: "Antoine Khoury", email: "antoine.khoury@gmail.com", vip: true },
    "70123456": { name: "Layla Nassar", email: "layla.n@hotmail.com", vip: false },
    "76543210": { name: "Charbel Hage", email: "", vip: true },
    "01337327": { name: "Maya Tabet", email: "m.tabet@outlook.com", vip: false },
  }
  const hit = mock[normalized]
  return hit ? { ...hit, visitCount: 1 + Math.floor(Math.random() * 18) } : null
}
