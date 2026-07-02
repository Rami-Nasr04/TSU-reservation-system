import * as React from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"

import { AppShell } from "@/components/layout/AppShell"
import { KpiStrip } from "@/components/calendar/KpiStrip"
import { Legend } from "@/components/calendar/Legend"
import { MonthGrid } from "@/components/calendar/MonthGrid"
import { ErrorState } from "@/components/states/ErrorState"
import { useMonth } from "@/hooks/useMonth"
import { monthLabel, shiftMonth, todayParts } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { DayCellVariant } from "@/components/calendar/DayCell"
import type { MonthFeed } from "@/services/reservationsService"

function useVariant(): DayCellVariant {
  const [w, setW] = React.useState<number>(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  )
  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  if (w < 640) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

export default function Calendar() {
  const today = todayParts()
  const [year, setYear] = React.useState(today.year)
  const [month0, setMonth0] = React.useState(today.month0)
  const [reloadNonce, setReloadNonce] = React.useState(0)
  const variant = useVariant()
  const { data, isLoading, max, error } = useMonth(year, month0, reloadNonce)

  function go(delta: number) {
    const next = shiftMonth(year, month0, delta)
    setYear(next.year)
    setMonth0(next.month0)
  }

  function goToday() {
    setYear(today.year)
    setMonth0(today.month0)
  }

  const isMobile = variant === "mobile"

  const headerCenter = (
    <div className="inline-flex items-center gap-1 sm:gap-2.5">
      <IconButton aria-label="Previous month" onClick={() => go(-1)}>
        <ChevronLeft className="size-3.5 sm:size-4" />
      </IconButton>
      <div
        className={cn(
          "text-center font-light tracking-[0.04em] text-foreground",
          "min-w-[84px] sm:min-w-[150px]",
          isMobile ? "text-[15px]" : "text-[18px]",
        )}
      >
        {monthLabel(year, month0)}
      </div>
      <IconButton aria-label="Next month" onClick={() => go(1)}>
        <ChevronRight className="size-3.5 sm:size-4" />
      </IconButton>
    </div>
  )

  const headerActions = (
    <>
      {!isMobile && (
        <button
          type="button"
          onClick={goToday}
          className="h-8 rounded-[3px] border border-hair-strong bg-transparent px-3.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-foreground hover:bg-muted"
        >
          Today
        </button>
      )}
      {!isMobile && (
        <IconButton
          aria-label="Search"
          onClick={() => toast.info("Search is coming with the DayBoard.")}
        >
          <Search className="size-3.5 sm:size-4" />
        </IconButton>
      )}
    </>
  )

  // "This week" stats — sum the month feed for days falling in the current
  // real-world Mon-Sun week. When the viewed month doesn't overlap this week
  // at all, both values stay null so KpiStrip renders em-dashes.
  const kpi = React.useMemo(() => weekStats(data), [data])

  return (
    <AppShell headerCenter={headerCenter} headerActions={headerActions}>
      {error && !data ? (
        <div className="min-h-[70dvh]">
          <ErrorState onRetry={() => setReloadNonce((n) => n + 1)} />
        </div>
      ) : (
        <>
          {isMobile && (
            <KpiStrip reservations={kpi.reservations} covers={kpi.covers} compact />
          )}
          {data && <MonthGrid feed={data} max={max} variant={variant} />}
          {isLoading && !data && (
            <div className="py-12 text-center text-[11px] tracking-[0.22em] uppercase text-brand-ink-mute">
              Loading…
            </div>
          )}
          {!isMobile && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <KpiStrip reservations={kpi.reservations} covers={kpi.covers} />
              <Legend />
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

interface WeekStats {
  reservations: number | null
  covers: number | null
}

/**
 * Sum the month feed for the days in the current real-world Mon-Sun week.
 * Returns nulls when the viewed month contains zero days from this week
 * (different month in view, or feed not loaded).
 */
function weekStats(feed: MonthFeed | null): WeekStats {
  if (!feed) return { reservations: null, covers: null }
  const t = todayParts()
  const today = new Date(t.year, t.month0, t.day)
  // Monday of this week. JS getDay(): 0=Sun..6=Sat → shift so Mon=0.
  const dowMonFirst = (today.getDay() + 6) % 7
  const monday = new Date(t.year, t.month0, t.day - dowMonFirst)
  const sunday = new Date(t.year, t.month0, t.day - dowMonFirst + 6)

  let reservations = 0
  let covers = 0
  let overlap = 0
  for (const d of feed.days) {
    const dt = new Date(feed.year, feed.month0, d.day)
    if (dt >= monday && dt <= sunday) {
      overlap += 1
      reservations += d.count
      for (const it of d.items) covers += it.pax
    }
  }
  if (overlap === 0) return { reservations: null, covers: null }
  return { reservations, covers }
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

function IconButton({ className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[3px] text-foreground",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
