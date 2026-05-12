import { dayOfWeek, daysInMonth, firstWeekdayOfMonth } from "@/lib/dates"

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
