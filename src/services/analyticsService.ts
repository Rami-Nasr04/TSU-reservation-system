import { apiFetch } from "./apiClient"
import type { ReservationStatus } from "./reservationsService"

// ---------- Range ----------

/**
 * Range presets mirror the backend's `rangeToInterval`. A `{from, to}` pair maps
 * to `?from=&to=`; a preset maps to `?range=`. The backend resolves a same-length
 * previous window for delta math, so the frontend only needs to pass the range.
 */
export type AnalyticsRange =
  | "today"
  | "week"
  | "month"
  | "last30"
  | { from: string; to: string }

function rangeQuery(range: AnalyticsRange): string {
  if (typeof range === "string") return `range=${range}`
  return `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
}

/** Stable string key for a range — for hook effect deps (objects break ===). */
export function rangeKey(range: AnalyticsRange): string {
  return typeof range === "string" ? range : `${range.from}:${range.to}`
}

// ---------- KPI ----------

export interface KpiMetric {
  value: number
  prev: number
  deltaPct: number
}

export interface KpiSnapshot {
  reservations: KpiMetric
  revenue: KpiMetric
  tips: KpiMetric
  avgPax: KpiMetric
}

// Backend metric — outer keys are camelCase, only the delta is snake_case.
interface KpiMetricRow {
  value: number
  prev: number
  delta_pct: number
}

interface KpiRow {
  reservations: KpiMetricRow
  revenue: KpiMetricRow
  tips: KpiMetricRow
  avgPax: KpiMetricRow
}

function adaptMetric(row: KpiMetricRow): KpiMetric {
  return { value: row.value, prev: row.prev, deltaPct: row.delta_pct }
}

/**
 * KPI snapshot for the dashboard cards. Revenue = Σ total_bill, tips = Σ tip,
 * both over `status='completed'` only (locked backend convention — must match any
 * manual check). `deltaPct` compares against the same-length previous window.
 */
export async function getKpi(range: AnalyticsRange): Promise<KpiSnapshot> {
  const res = await apiFetch<KpiRow>(`/analytics/kpi?${rangeQuery(range)}`)
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load KPIs")
  }
  const row = res.data
  return {
    reservations: adaptMetric(row.reservations),
    revenue: adaptMetric(row.revenue),
    tips: adaptMetric(row.tips),
    avgPax: adaptMetric(row.avgPax),
  }
}

// ---------- Rush hour ----------

export interface RushHourBucket {
  hour: number // 0–23
  count: number
}

interface RushHourRow {
  hour: number
  count: number
}

/** Restaurant operating hours (12pm–11pm seating window). */
const RUSH_FROM = 12
const RUSH_TO = 23

/**
 * Hourly reservation counts. The backend response is sparse (only hours with
 * completed reservations appear), so we zero-fill the operating window 12–23 and
 * widen it to cover any out-of-window hours present in the data.
 */
export async function getRushHour(
  range: AnalyticsRange,
): Promise<RushHourBucket[]> {
  const res = await apiFetch<RushHourRow[]>(
    `/analytics/rush-hour?${rangeQuery(range)}`,
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load rush hour")
  }
  const counts = new Map<number, number>()
  for (const r of res.data) counts.set(r.hour, r.count)
  const hours = res.data.map((r) => r.hour)
  const from = Math.min(RUSH_FROM, ...hours)
  const to = Math.max(RUSH_TO, ...hours)
  const buckets: RushHourBucket[] = []
  for (let h = from; h <= to; h++) {
    buckets.push({ hour: h, count: counts.get(h) ?? 0 })
  }
  return buckets
}

// ---------- Weekly overview ----------

export interface WeeklyBucket {
  day: string // "Mon" … "Sun"
  dow: number // 1 (Mon) … 7 (Sun)
  reservations: number
  revenue: number
}

interface WeeklyRow {
  dow: number // ISODOW: 1=Mon … 7=Sun
  reservations: number
  revenue: number
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

/**
 * Reservations + revenue per day-of-week (Mon→Sun). The backend response is
 * sparse, so we zero-fill all seven days and keep them in calendar order.
 */
export async function getWeekly(range: AnalyticsRange): Promise<WeeklyBucket[]> {
  const res = await apiFetch<WeeklyRow[]>(
    `/analytics/weekly?${rangeQuery(range)}`,
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load weekly overview")
  }
  const byDow = new Map<number, WeeklyRow>()
  for (const r of res.data) byDow.set(r.dow, r)
  return DOW_LABELS.map((day, i) => {
    const dow = i + 1
    const row = byDow.get(dow)
    return {
      day,
      dow,
      reservations: row?.reservations ?? 0,
      revenue: row?.revenue ?? 0,
    }
  })
}

// ---------- Table performance ----------

export interface TablePerf {
  tableId: number
  label: string
  section: string
  reservations: number
  revenue: number
  avgPax: number
  tips: number
}

interface TablePerfRow {
  table_id: number
  label: string
  section: string
  reservations: number
  revenue: number
  avg_pax: number
  tips: number
}

/**
 * Per-table aggregates, ordered by revenue desc. Caveat (from the backend): a
 * merged reservation credits the full bill/tip to each occupied table, so read
 * this as "tables associated with revenue", not a partition of total revenue.
 */
export async function getTablePerformance(
  range: AnalyticsRange,
): Promise<TablePerf[]> {
  const res = await apiFetch<TablePerfRow[]>(
    `/analytics/table-performance?${rangeQuery(range)}`,
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load table performance")
  }
  return res.data.map((row) => ({
    tableId: row.table_id,
    label: row.label,
    section: row.section,
    reservations: row.reservations,
    revenue: row.revenue,
    avgPax: row.avg_pax,
    tips: row.tips,
  }))
}

// ---------- Recent walk-ins ----------

export interface RecentWalkIn {
  id: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm"
  pax: number
  status: ReservationStatus
  totalBill: number | null
  tip: number | null
  customerName: string | null
  tables: string[]
}

interface RecentWalkInRow {
  id: string
  date: string
  start_time: string
  pax: number
  status: ReservationStatus
  total_bill: number | null
  tip: number | null
  customer_name: string | null
  tables: string[] | null
}

/** Slice the calendar day off an ISO timestamp without a Date parse (no TZ drift). */
function isoDay(value: string): string {
  return value.slice(0, 10)
}

/** Last N walk-ins across all sections, newest first. `limit` clamps to [1,50]. */
export async function getRecentWalkIns(limit = 10): Promise<RecentWalkIn[]> {
  const res = await apiFetch<RecentWalkInRow[]>(
    `/analytics/walk-ins?limit=${limit}`,
  )
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? "Failed to load walk-ins")
  }
  return res.data.map((row) => ({
    id: row.id,
    date: isoDay(row.date),
    time: row.start_time.slice(0, 5),
    pax: row.pax,
    status: row.status,
    totalBill: row.total_bill,
    tip: row.tip,
    customerName: row.customer_name,
    tables: row.tables ?? [],
  }))
}
