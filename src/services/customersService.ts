import { apiFetch, shouldUseMock } from "./apiClient"
import type { ReservationStatus } from "./reservationsService"

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

// ---------- Customers CRM (Phase 3) ----------

/** Enriched customer row composed from the `customers_with_stats` view. */
export interface CustomerWithStats {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  vip: boolean
  tags: string[]
  notes: string | null
  visitCount: number
  lifetimeSpend: number
  lifetimeTips: number
  avgPax: number | null
  avgTip: number | null
  lastVisit: string | null // "YYYY-MM-DD"
}

/** One row in the drawer's reservation-history table. */
export interface ReservationHistoryItem {
  id: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm"
  tables: string[]
  pax: number
  totalBill: number | null
  tip: number | null
  status: ReservationStatus
}

export type CustomerSegment = "regulars" | "lapsed" | "new"
export type CustomerSort = "last_visit_desc" | "visits_desc" | "name_asc"

export interface CustomerFilters {
  search?: string
  vip?: boolean
  segment?: CustomerSegment
  sort?: CustomerSort
  limit?: number
  offset?: number
}

/** Partial update payload for PATCH /customers/{id}. */
export interface CustomerPatch {
  name?: string | null
  phone?: string | null
  email?: string | null
  vip?: boolean
  tags?: string[]
  notes?: string | null
}

// Flat row from GET /customers (customers_with_stats view) and PATCH /customers/{id}.
interface CustomerStatsRow {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  vip: boolean
  tags: string[] | null
  notes: string | null
  visit_count: number
  lifetime_spend: number
  lifetime_tips: number
  avg_pax: number | null
  avg_tip: number | null
  last_visit: string | null
}

// Flat row from GET /customers/{id}/reservations.
interface CustomerReservationRow {
  id: string
  date: string
  start_time: string
  pax: number
  total_bill: number | null
  tip: number | null
  status: ReservationStatus
  tables: string[] | null
}

/** Slice the calendar day off an ISO timestamp without a Date parse (no TZ drift). */
function isoDay(value: string | null): string | null {
  return value ? value.slice(0, 10) : null
}

function adaptCustomer(row: CustomerStatsRow): CustomerWithStats {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    vip: row.vip,
    tags: row.tags ?? [],
    notes: row.notes,
    visitCount: row.visit_count,
    lifetimeSpend: row.lifetime_spend,
    lifetimeTips: row.lifetime_tips,
    avgPax: row.avg_pax,
    avgTip: row.avg_tip,
    lastVisit: isoDay(row.last_visit),
  }
}

/**
 * CRM list backed by the `customers_with_stats` view. Maps the filter object to
 * query params: `vip`, `segment` (regulars/lapsed/new), `sort`, `search`, plus
 * paging. Stats reflect completed reservations only (per the view).
 */
export async function listCustomers(
  filters: CustomerFilters = {},
): Promise<CustomerWithStats[]> {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.vip) params.set("vip", "true")
  if (filters.segment) params.set("segment", filters.segment)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.limit != null) params.set("limit", String(filters.limit))
  if (filters.offset != null) params.set("offset", String(filters.offset))
  const qs = params.toString()
  const res = await apiFetch<CustomerStatsRow[]>(`/customers${qs ? `?${qs}` : ""}`)
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load customers")
  }
  return res.data.map(adaptCustomer)
}

/** Recent reservation history for the drawer (newest first, all statuses). */
export async function getCustomerHistory(
  id: string,
  limit = 6,
): Promise<ReservationHistoryItem[]> {
  const res = await apiFetch<CustomerReservationRow[]>(
    `/customers/${id}/reservations?limit=${limit}`,
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load history")
  }
  return res.data.map((row) => ({
    id: row.id,
    date: isoDay(row.date) ?? row.date,
    time: row.start_time.slice(0, 5),
    tables: row.tables ?? [],
    pax: row.pax,
    totalBill: row.total_bill,
    tip: row.tip,
    status: row.status,
  }))
}

/**
 * Partial update — only the supplied keys are written (dynamic SET on the
 * backend, no default-clobber). Name/email empty strings coerce to null and the
 * phone is normalized to E.164-or-null to match the backend's validation.
 */
export async function patchCustomer(
  id: string,
  patch: CustomerPatch,
): Promise<CustomerWithStats> {
  const body: CustomerPatch = { ...patch }
  if ("name" in body) body.name = emptyToNull(body.name)
  if ("email" in body) body.email = emptyToNull(body.email)
  if ("phone" in body) body.phone = normalizePhone(body.phone)
  if ("notes" in body) body.notes = emptyToNull(body.notes)
  const res = await apiFetch<CustomerStatsRow>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
  if (!res.success || !res.data) throw new Error(res.error?.message ?? "Save failed")
  return adaptCustomer(res.data)
}

/**
 * Hard-delete. The DB cascades nothing — a customer with reservations triggers a
 * 409 CONFLICT (FK), surfaced here as a friendly message the caller can toast.
 */
export async function deleteCustomer(id: string): Promise<void> {
  const res = await apiFetch<{ id: string }>(`/customers/${id}`, {
    method: "DELETE",
  })
  if (!res.success) {
    if (res.error?.code === "CONFLICT") {
      throw new Error(
        "Cannot delete — customer has reservations. Reassign or cancel them first.",
      )
    }
    throw new Error(res.error?.message ?? "Delete failed")
  }
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
