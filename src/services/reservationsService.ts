import { dayOfWeek, daysInMonth, firstWeekdayOfMonth, formatDateISO } from "@/lib/dates"
import {
  BAR_TABLES,
  INDOOR_TABLES,
  TERRACE_TABLES,
} from "@/lib/tables"
import { apiFetch, shouldUseMock } from "./apiClient"
import { upsertCustomer, type CustomerInput } from "./customersService"

export interface ReservationItem {
  time: string // "HH:mm"
  name: string
  pax: number
}

export interface MonthDay {
  day: number // 1..31
  count: number
  items: ReservationItem[]
}

export interface MonthFeed {
  year: number
  month0: number
  daysInMonth: number
  firstWeekday: number // 0=Sun..6=Sat
  days: MonthDay[] // index = day-1
}

const NAMES = [
  "Mkhayel", "Tawk", "Boustany", "Khalil", "Saliba", "Tabet",
  "Hage", "Chami", "Asmar", "Geagea", "Karam", "Rizk",
  "Helou", "Daoud", "Aoun", "Sleiman", "Fares", "Murr",
  "Maalouf", "Estephan", "Bechara", "Tueni", "Hayek", "Abou Khalil",
  "Nassar", "Eid", "Sfeir", "Ghosn", "Khoury", "Sader",
]
const TIMES = [
  "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
]

function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateMonth(year: number, month0: number): MonthDay[] {
  const total = daysInMonth(year, month0)
  const days: MonthDay[] = []
  for (let d = 1; d <= total; d++) {
    const rng = mulberry32(year * 10000 + (month0 + 1) * 100 + d)
    const dow = dayOfWeek(year, month0, d) // 0=Sun..6=Sat
    let base = 8 + Math.floor(rng() * 6)
    if (dow === 5 || dow === 6) base += 6 + Math.floor(rng() * 5)
    if (dow === 0) base += 2 + Math.floor(rng() * 4)
    if (dow === 1) base = Math.max(2, base - 5)
    // sprinkle a closed Monday for visual variety
    if (dow === 1 && d % 21 === 4) base = 0

    const count = base
    const items: ReservationItem[] = []
    for (let i = 0; i < count; i++) {
      items.push({
        time: TIMES[Math.floor(rng() * TIMES.length)],
        name: NAMES[Math.floor(rng() * NAMES.length)],
        pax: 2 + Math.floor(rng() * 6),
      })
    }
    items.sort((a, b) => a.time.localeCompare(b.time))
    days.push({ day: d, count, items })
  }
  return days
}

async function mockGetMonth(year: number, month0: number): Promise<MonthFeed> {
  // simulate network latency for spinner UX
  await new Promise((r) => setTimeout(r, 120))
  return {
    year,
    month0,
    daysInMonth: daysInMonth(year, month0),
    firstWeekday: firstWeekdayOfMonth(year, month0),
    days: generateMonth(year, month0),
  }
}

/**
 * Returns the month feed. Live path calls `GET /reservations?from=&to=` for the
 * month's date span and aggregates by calendar day in JS (no dedicated month
 * endpoint — spec option A). Flip back to the mock by adding `/reservations` to
 * MOCK_ENDPOINTS.
 */
export async function getMonth(year: number, month0: number): Promise<MonthFeed> {
  if (shouldUseMock("/reservations")) return mockGetMonth(year, month0)
  const total = daysInMonth(year, month0)
  const from = formatDateISO(year, month0, 1)
  const to = formatDateISO(year, month0, total)
  const res = await apiFetch<ReservationRow[]>(`/reservations?from=${from}&to=${to}`)
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load month")
  }
  return adaptToMonthFeed(year, month0, res.data)
}

function adaptToMonthFeed(
  year: number,
  month0: number,
  rows: ReservationRow[],
): MonthFeed {
  const total = daysInMonth(year, month0)
  const days: MonthDay[] = Array.from({ length: total }, (_, i) => ({
    day: i + 1,
    count: 0,
    items: [],
  }))
  for (const row of rows) {
    // row.date is "YYYY-MM-DDT00:00:00.000Z" — slice the calendar day, no Date parse (avoids TZ drift).
    const dayOfMonth = Number(row.date.slice(8, 10))
    const idx = dayOfMonth - 1
    if (idx < 0 || idx >= total) continue
    days[idx].count += 1
    days[idx].items.push({
      time: row.start_time.slice(0, 5),
      name: row.customer_name ?? (row.is_walk_in ? "Walk-in" : "Anonymous"),
      pax: row.pax,
    })
  }
  for (const d of days) d.items.sort((a, b) => a.time.localeCompare(b.time))
  return {
    year,
    month0,
    daysInMonth: total,
    firstWeekday: firstWeekdayOfMonth(year, month0),
    days,
  }
}

// ---------- Day-feed types & service ----------

export type ReservationStatus =
  | "booked"
  | "seated"
  | "completed"
  | "cancelled"
  | "noshow"

export type ReservationOccasion =
  | "birthday"
  | "anniversary"
  | "business"
  | "other"

export type ShiftId = "lunch" | "afternoon" | "late"

export interface Reservation {
  id: string
  /** "HH:mm" — 15-min step. */
  time: string
  name: string
  pax: number
  /** Table labels — strings like "20", "1", "60". For merges, multiple labels. */
  tables: string[]
  status: ReservationStatus
  shift: ShiftId
  isWalkIn: boolean
  vip: boolean
  /** Customer FK — surfaced so the edit modal can patch the right customer. */
  customerId?: string | null
  /** Linked customer's phone (free-text) — surfaced for the edit modal prefill. */
  customerPhone?: string | null
  /** Linked customer's email — surfaced for the edit modal prefill. */
  customerEmail?: string | null
  occasion?: ReservationOccasion
  notes?: string
  totalBill?: number
  amountPaid?: number
  tip?: number
}

/**
 * Flat enriched row as returned by `GET /reservations` (+ `?date=`/`?from=&to=`)
 * and `GET /reservations/{id}`. `customer_name`/`vip` come from the LEFT JOIN to
 * customers; `table_labels`/`primary_label` from the LATERAL aggregate over
 * reservation_tables (primary first). `start_time` is "HH:mm:ss"; `date` is a full
 * ISO timestamp at UTC midnight ("YYYY-MM-DDT00:00:00.000Z").
 */
export interface ReservationRow {
  id: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  vip: boolean | null
  date: string
  start_time: string
  pax: number
  status: ReservationStatus
  is_walk_in: boolean
  occasion: ReservationOccasion | null
  notes: string | null
  total_bill: number | null
  amount_paid: number | null
  tip: number | null
  shift: ShiftId
  created_by: string | null
  created_at: string
  updated_at: string
  table_labels: string[]
  primary_label: string | null
}

/**
 * Input for create/update. `customer` is the upsert source for NEW reservations
 * (skipped when null or blank); `customerId` preserves an existing link on edits/
 * checkout without re-upserting. `tables` holds table LABELS — index 0 is the
 * primary — which the service resolves to numeric ids before hitting the API.
 */
export interface ReservationInput {
  customer: CustomerInput | null
  customerId: string | null
  date: string
  start_time: string
  pax: number
  status: ReservationStatus
  is_walk_in: boolean
  occasion: ReservationOccasion | null
  notes: string | null
  total_bill: number | null
  amount_paid: number | null
  tables: string[]
}

export interface ShiftSummary {
  id: ShiftId | "all"
  label: string
  hours: string | null
  count: number
}

export interface DayCounters {
  reservations: number
  guests: number
  walkIns: number
  seated: number
}

export interface DayFeed {
  date: string
  reservations: Reservation[]
  shifts: ShiftSummary[]
  counters: DayCounters
}

const FIRST_NAMES = [
  "Karam", "Mkhayel", "Tueni", "Saliba", "Hage", "Chami", "Asmar", "Geagea",
  "Sleiman", "Murr", "Hayek", "Estephan", "Tabet", "Aoun", "Bechara", "Helou",
]

function pickTable(rng: () => number, isBar: boolean): string {
  if (isBar) {
    const idx = Math.floor(rng() * BAR_TABLES.length)
    return BAR_TABLES[idx].id
  }
  const pool = rng() < 0.65 ? INDOOR_TABLES : TERRACE_TABLES
  return pool[Math.floor(rng() * pool.length)].id
}

export function bucketShift(timeHHmm: string): ShiftId {
  const [h, m] = timeHHmm.split(":").map(Number)
  const mins = h * 60 + m
  if (mins < 14 * 60) return "lunch"
  if (mins < 19 * 60) return "afternoon"
  return "late"
}

function pseudoStatus(
  timeHHmm: string,
  now: { h: number; m: number },
  rng: () => number,
): ReservationStatus {
  const [h, m] = timeHHmm.split(":").map(Number)
  const mins = h * 60 + m
  const nowMins = now.h * 60 + now.m
  const roll = rng()
  if (roll < 0.05) return "cancelled"
  if (roll < 0.07) return "noshow"
  if (mins + 60 < nowMins) return rng() < 0.8 ? "completed" : "seated"
  if (mins <= nowMins + 30) return rng() < 0.5 ? "seated" : "booked"
  return "booked"
}

/**
 * Returns the day feed for the given local-date YYYY-MM-DD. Live path calls
 * `GET /reservations?date=` and adapts the enriched rows into a DayFeed (bucket
 * by shift + counters). Flip back to the mock by adding `/reservations` to
 * MOCK_ENDPOINTS.
 */
export async function getDay(date: string): Promise<DayFeed> {
  if (shouldUseMock("/reservations")) return mockGetDay(date)
  const res = await apiFetch<ReservationRow[]>(`/reservations?date=${date}`)
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load day")
  }
  return adaptToDayFeed(date, res.data)
}

/** Map one enriched backend row to the UI `Reservation` shape. */
function adaptRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    time: row.start_time.slice(0, 5),
    name: row.customer_name ?? (row.is_walk_in ? "Walk-in" : "Anonymous"),
    pax: row.pax,
    tables: row.table_labels,
    status: row.status,
    shift: row.shift,
    isWalkIn: row.is_walk_in,
    vip: row.vip ?? false,
    customerId: row.customer_id,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    occasion: row.occasion ?? undefined,
    notes: row.notes ?? undefined,
    totalBill: row.total_bill ?? undefined,
    amountPaid: row.amount_paid ?? undefined,
    tip: row.tip ?? undefined,
  }
}

/** Compose enriched rows into a DayFeed — same bucketing/counters as the mock. */
function adaptToDayFeed(date: string, rows: ReservationRow[]): DayFeed {
  const reservations = rows.map(adaptRow)
  reservations.sort((a, b) => a.time.localeCompare(b.time))

  const byShift: Record<ShiftId, number> = { lunch: 0, afternoon: 0, late: 0 }
  let guests = 0
  let walkIns = 0
  let seated = 0
  for (const r of reservations) {
    byShift[r.shift] += 1
    guests += r.pax
    if (r.isWalkIn) walkIns += 1
    if (r.status === "seated") seated += 1
  }

  const shifts: ShiftSummary[] = [
    { id: "lunch",     label: "Lunch",       hours: "12–2pm",     count: byShift.lunch },
    { id: "afternoon", label: "Afternoon",   hours: "2–7pm",      count: byShift.afternoon },
    { id: "late",      label: "Late Dinner", hours: "7pm–12am",  count: byShift.late },
    { id: "all",       label: "All",         hours: null,         count: reservations.length },
  ]

  return {
    date,
    reservations,
    shifts,
    counters: {
      reservations: reservations.length,
      guests,
      walkIns,
      seated,
    },
  }
}

async function mockGetDay(date: string): Promise<DayFeed> {
  await new Promise((r) => setTimeout(r, 120))
  const parts = date.split("-").map(Number)
  const seed = parts[0] * 10000 + parts[1] * 100 + parts[2]
  const rng = mulberry32(seed)
  const dow = new Date(parts[0], parts[1] - 1, parts[2]).getDay()
  const now = new Date()
  const nowParts = { h: now.getHours(), m: now.getMinutes() }

  let count = 12 + Math.floor(rng() * 8)
  if (dow === 5 || dow === 6) count += 6 + Math.floor(rng() * 6)
  if (dow === 1) count = Math.max(4, count - 5)

  const dayTimes = [
    "12:00", "12:30", "13:00", "13:30", "14:00",
    "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
  ]

  const reservations: Reservation[] = []
  const usedTables = new Set<string>()
  for (let i = 0; i < count; i++) {
    const isBar = rng() < 0.25
    let tableId = pickTable(rng, isBar)
    let attempts = 0
    while (usedTables.has(tableId) && attempts < 8) {
      tableId = pickTable(rng, isBar)
      attempts += 1
    }
    usedTables.add(tableId)
    const time = dayTimes[Math.floor(rng() * dayTimes.length)]
    const status = pseudoStatus(time, nowParts, rng)
    const isWalkIn = !isBar && rng() < 0.12
    reservations.push({
      id: `r-${date}-${i}`,
      time,
      name: isWalkIn ? "Walk-in" : FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)],
      pax: 2 + Math.floor(rng() * 6),
      tables: [tableId],
      status,
      shift: bucketShift(time),
      isWalkIn,
      vip: !isWalkIn && rng() < 0.12,
    })
  }

  reservations.sort((a, b) => a.time.localeCompare(b.time))

  const byShift: Record<ShiftId, number> = { lunch: 0, afternoon: 0, late: 0 }
  let guests = 0
  let walkIns = 0
  let seated = 0
  for (const r of reservations) {
    byShift[r.shift] += 1
    guests += r.pax
    if (r.isWalkIn) walkIns += 1
    if (r.status === "seated") seated += 1
  }

  const shifts: ShiftSummary[] = [
    { id: "lunch",     label: "Lunch",       hours: "12–2pm",     count: byShift.lunch },
    { id: "afternoon", label: "Afternoon",   hours: "2–7pm",      count: byShift.afternoon },
    { id: "late",      label: "Late Dinner", hours: "7pm–12am",  count: byShift.late },
    { id: "all",       label: "All",         hours: null,         count: reservations.length },
  ]

  return {
    date,
    reservations,
    shifts,
    counters: {
      reservations: reservations.length,
      guests,
      walkIns,
      seated,
    },
  }
}

// ---------- Mutations (create / update / delete) ----------

interface TableRow {
  id: number
  label: string
}

// The UI works in table LABELS but POST/PUT need numeric table_id. Cache the
// label→id map from GET /tables (table inventory is static in v1; Settings will
// invalidate this in P4 once it can mutate tables).
let tableIdMapCache: Map<string, number> | null = null

/**
 * Drop the cached label→id map. Settings calls this after any table
 * create/patch/delete so the next reservation mutation re-reads `GET /tables`
 * (new labels resolve, removed ones stop resolving).
 */
export function invalidateTableIdMap(): void {
  tableIdMapCache = null
}

async function getTableIdMap(): Promise<Map<string, number>> {
  if (tableIdMapCache) return tableIdMapCache
  const res = await apiFetch<TableRow[]>("/tables")
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load tables")
  }
  const map = new Map<string, number>()
  for (const t of res.data) map.set(t.label, t.id)
  tableIdMapCache = map
  return map
}

async function resolveTables(
  labels: string[],
): Promise<{ table_id: number; is_primary: boolean }[]> {
  if (labels.length === 0) return []
  const idMap = await getTableIdMap()
  return labels.map((label, i) => {
    const id = idMap.get(label)
    if (id === undefined) throw new Error(`Unknown table "${label}"`)
    return { table_id: id, is_primary: i === 0 }
  })
}

// Upsert the customer for new reservations; otherwise keep the existing FK.
async function resolveCustomerId(input: ReservationInput): Promise<string | null> {
  if (input.customer && (input.customer.name?.trim() || input.customer.phone?.trim())) {
    const customer = await upsertCustomer(input.customer)
    return customer.id
  }
  return input.customerId ?? null
}

function reservationBody(
  input: ReservationInput,
  customerId: string | null,
  tables: { table_id: number; is_primary: boolean }[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customer_id: customerId,
    date: input.date,
    start_time: input.start_time,
    pax: input.pax,
    status: input.status,
    is_walk_in: input.is_walk_in,
    occasion: input.occasion,
    notes: input.notes,
    total_bill: input.total_bill,
    amount_paid: input.amount_paid,
  }
  // Backend rejects an empty tables array (min(1)); omit it to mean "no seating".
  if (tables.length > 0) body.tables = tables
  return body
}

// The backend maps Postgres 23P01 (exclusion constraint) → 409 CONFLICT with a
// code-only payload, so we own the user-facing copy here rather than surfacing
// raw SQL through the toast.
function reservationMutationMessage(
  code: string | undefined,
  fallback: string,
  rawMessage: string | undefined,
): string {
  if (code === "CONFLICT") return "That table is already reserved at this time."
  return rawMessage ?? fallback
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  const customerId = await resolveCustomerId(input)
  const tables = await resolveTables(input.tables)
  const res = await apiFetch<ReservationRow>("/reservations", {
    method: "POST",
    body: JSON.stringify(reservationBody(input, customerId, tables)),
  })
  if (!res.success || !res.data) {
    throw new Error(
      reservationMutationMessage(
        res.error?.code,
        "Failed to create reservation",
        res.error?.message,
      ),
    )
  }
  return adaptRow(res.data)
}

export async function updateReservation(
  id: string,
  input: ReservationInput,
): Promise<Reservation> {
  const customerId = await resolveCustomerId(input)
  const tables = await resolveTables(input.tables)
  const res = await apiFetch<ReservationRow>(`/reservations/${id}`, {
    method: "PUT",
    body: JSON.stringify(reservationBody(input, customerId, tables)),
  })
  if (!res.success || !res.data) {
    throw new Error(
      reservationMutationMessage(
        res.error?.code,
        "Failed to update reservation",
        res.error?.message,
      ),
    )
  }
  return adaptRow(res.data)
}

export async function deleteReservation(id: string): Promise<void> {
  const res = await apiFetch<{ deleted: boolean }>(`/reservations/${id}`, {
    method: "DELETE",
  })
  if (!res.success) {
    throw new Error(res.error?.message ?? "Failed to delete reservation")
  }
}
