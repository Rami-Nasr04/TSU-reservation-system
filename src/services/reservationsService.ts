import { dayOfWeek, daysInMonth, firstWeekdayOfMonth } from "@/lib/dates"
import {
  BAR_TABLES,
  INDOOR_TABLES,
  TERRACE_TABLES,
} from "@/lib/tables"

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

/**
 * Returns the month feed.
 *
 * BACKEND CONTRACT: when `GET /reservations/month?year=&month=` is implemented,
 * swap the body to `apiFetch<MonthFeed>(\`/reservations/month?year=...&month=...\`)`
 * and return `result.data`. The shape stays identical.
 */
export async function getMonth(year: number, month0: number): Promise<MonthFeed> {
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
  occasion?: ReservationOccasion
  notes?: string
  totalBill?: number
  amountPaid?: number
  tip?: number
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

function bucketShift(timeHHmm: string): ShiftId {
  const [h, m] = timeHHmm.split(":").map(Number)
  const mins = h * 60 + m
  if (mins < 14 * 60) return "lunch"
  if (mins < 21 * 60) return "afternoon"
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
 * Returns the day feed for the given local-date YYYY-MM-DD.
 *
 * BACKEND CONTRACT: when `GET /reservations?date=YYYY-MM-DD` is implemented,
 * swap the body to `apiFetch<DayFeed>("/reservations?date=" + date)` and
 * return `result.data`. The shape stays identical.
 */
export async function getDay(date: string): Promise<DayFeed> {
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
    { id: "afternoon", label: "Afternoon",   hours: "2–9pm",      count: byShift.afternoon },
    { id: "late",      label: "Late Dinner", hours: "9–11:30pm",  count: byShift.late },
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
