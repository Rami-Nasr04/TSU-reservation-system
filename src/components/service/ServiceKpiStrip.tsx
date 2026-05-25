import React from "react"
import { cn } from "@/lib/utils"
import { hhmmToMinutes, nowMinutes, formatDurationShort } from "@/lib/dates"
import type { DayFeed } from "@/services/reservationsService"

interface ServiceKpiStripProps {
  feed: DayFeed
  totalTables: number
}

interface LiveStatProps {
  label: string
  value: string
  sub: string
  dot?: "red" | "amber"
  tone?: "good"
}

/** Single stat cell used inside ServiceKpiStrip. */
function LiveStat({ label, value, sub, dot, tone }: LiveStatProps) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3.5 border-l border-hair first:border-l-0">
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        {dot && (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              dot === "red" ? "bg-primary" : "bg-brand-amber",
            )}
          />
        )}
        <span className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft">
          {label}
        </span>
      </div>
      {/* Value row */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-light leading-none text-foreground [font-variant-numeric:tabular-nums]">
          {value}
        </span>
        <span
          className={cn(
            "text-[10.5px] leading-none",
            tone === "good" ? "text-brand-green" : "text-brand-ink-mute",
          )}
        >
          {sub}
        </span>
      </div>
    </div>
  )
}

/** KPI strip showing 5 live stats for the service floor view. */
export function ServiceKpiStrip({ feed, totalTables }: ServiceKpiStripProps) {
  const stats = React.useMemo(() => {
    const nm = nowMinutes()

    // 1. Seated
    const seatedCount = feed.counters.seated

    // 2. Booked next 2h
    const upcomingNext2h = feed.reservations.filter(
      (r) =>
        r.status === "booked" &&
        hhmmToMinutes(r.time) > nm &&
        hhmmToMinutes(r.time) <= nm + 120,
    )
    const next2hCovers = upcomingNext2h.reduce((sum, r) => sum + r.pax, 0)

    // 3. Walk-ins
    const walkInCount = feed.counters.walkIns

    // 4. Avg turn — live proxy: average time current "seated" guests have been seated so far.
    const seatedRes = feed.reservations.filter((r) => r.status === "seated")
    let avgTurnValue = "—"
    let avgTurnSub = "no seated"
    if (seatedRes.length > 0) {
      const totalMins = seatedRes.reduce(
        (sum, r) => sum + Math.max(0, nm - hhmmToMinutes(r.time)),
        0,
      )
      const mean = totalMins / seatedRes.length
      avgTurnValue = formatDurationShort(mean)
      avgTurnSub = "seated so far"
    }

    // 5. Empty tables — booked counts as occupied (table is reserved even if not yet seated)
    const occupiedSet = new Set<string>()
    for (const r of feed.reservations) {
      if (r.status === "seated" || r.status === "booked") {
        for (const t of r.tables) occupiedSet.add(t)
      }
    }
    const emptyTables = Math.max(0, totalTables - occupiedSet.size)

    return {
      seatedCount,
      upcomingNext2h: upcomingNext2h.length,
      next2hCovers,
      walkInCount,
      avgTurnValue,
      avgTurnSub,
      emptyTables,
    }
  }, [feed, totalTables])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-hair bg-card">
      <LiveStat
        label="Seated"
        value={String(stats.seatedCount)}
        sub={`of ${feed.counters.reservations} today`}
        dot="red"
      />
      <LiveStat
        label="Booked next 2h"
        value={String(stats.upcomingNext2h)}
        sub={`${stats.next2hCovers} covers`}
        dot="amber"
      />
      <LiveStat
        label="Walk-ins"
        value={String(stats.walkInCount)}
        sub="today"
      />
      <LiveStat
        label="Avg turn"
        value={stats.avgTurnValue}
        sub={stats.avgTurnSub}
      />
      <LiveStat
        label="Empty tables"
        value={String(stats.emptyTables)}
        sub={`of ${totalTables}`}
        tone={stats.emptyTables > 0 ? "good" : undefined}
      />
    </div>
  )
}
