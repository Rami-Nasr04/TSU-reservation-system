import React from "react"
import { cn } from "@/lib/utils"
import { hhmmToMinutes, nowMinutes, parseDateISO, dayLabel } from "@/lib/dates"
import { bucketShift } from "@/services/reservationsService"
import type { DayFeed, ShiftId } from "@/services/reservationsService"

interface ServiceHeaderProps {
  date: string
  feed: DayFeed | null
}

const SHIFT_LABELS: Record<ShiftId, string> = {
  lunch: "Lunch",
  afternoon: "Afternoon",
  late: "Late Dinner",
}

/** Live clock that ticks every second. */
function LiveClock({ feed }: { feed: DayFeed | null }) {
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours()
  const ap = h < 12 ? "am" : "pm"
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = String(now.getMinutes()).padStart(2, "0")
  const ss = String(now.getSeconds()).padStart(2, "0")
  const timeStr = `${h12}:${mm}:${ss}${ap}`

  // Next upcoming booked reservation from now
  const nm = nowMinutes()
  let nextResMins: number | null = null
  if (feed) {
    for (const r of feed.reservations) {
      if (r.status === "booked") {
        const resMin = hhmmToMinutes(r.time)
        if (resMin >= nm) {
          const diff = resMin - nm
          if (nextResMins === null || diff < nextResMins) {
            nextResMins = diff
          }
        }
      }
    }
  }

  return (
    <div className="col-start-3 justify-self-end text-right min-w-0">
      <div
        className={cn(
          "text-xl sm:text-2xl font-light text-foreground [font-variant-numeric:tabular-nums]",
          "tracking-[-0.01em]",
        )}
      >
        {timeStr}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-brand-ink-soft truncate">
        {nextResMins !== null ? (
          <>
            <span className="hidden sm:inline">Next reservation in </span>
            <span className="sm:hidden">Next in </span>
            <span className="text-primary">{nextResMins}</span> min
          </>
        ) : (
          "No upcoming"
        )}
      </div>
    </div>
  )
}

/**
 * Service Mode page header — 3-zone grid with brand mark, shift label,
 * and a live ticking clock.
 */
export function ServiceHeader({ date, feed }: ServiceHeaderProps) {
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(now.getHours()).padStart(2, "0")
  const currentHHmm = `${hh}:${String(now.getMinutes()).padStart(2, "0")}`
  const currentShift = bucketShift(currentHHmm)
  const shiftLabel = SHIFT_LABELS[currentShift]

  const parts = parseDateISO(date)
  const dayStr = parts
    ? dayLabel(parts.year, parts.month0, parts.day)
    : date

  return (
    <header
      className={cn(
        "h-[72px] border-b border-hair bg-background",
        "grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6",
      )}
    >
      {/* LEFT: brand mark + title + live badge + subline */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Kanji badge */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-[3px]",
              "border border-hair bg-card text-foreground text-base",
            )}
          >
            津
          </div>
          {/* Red dot top-right */}
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 size-[7px] rounded-full bg-primary",
              "shadow-[0_0_8px_var(--primary)]",
            )}
          />
        </div>

        {/* Title + badge + subline */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base tracking-[0.04em] text-foreground whitespace-nowrap">
              Service Mode
            </span>
            {/* Live badge */}
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5",
                "bg-brand-green/10 text-brand-green",
                "text-[9px] font-medium uppercase tracking-[0.14em]",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-brand-green",
                  "animate-[sm-pulse_2s_ease-in-out_infinite]",
                )}
              />
              Live
            </span>
          </div>
          <div className="text-[11px] tracking-[0.02em] text-brand-ink-soft truncate">
            {dayStr} · {shiftLabel} shift
          </div>
        </div>
      </div>

      {/* CENTER: current shift label — hidden on mobile */}
      <div className="hidden sm:block text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
        {shiftLabel}
      </div>

      {/* RIGHT: live clock */}
      <LiveClock feed={feed} />
    </header>
  )
}
