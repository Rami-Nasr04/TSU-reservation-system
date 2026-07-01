import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime12, hhmmToMinutes, nowMinutes, formatDurationShort } from "@/lib/dates"
import type { DayFeed, Reservation } from "@/services/reservationsService"

interface ServiceQueueListProps {
  feed: DayFeed
  onReservationClick: (r: Reservation) => void
}

// ---------- ResRow ----------

interface ResRowProps {
  r: Reservation
  kind: "seated" | "upcoming"
  accent: string
  accentBar: string
  onClick: () => void
}

function ResRow({ r, kind, accent, accentBar, onClick }: ResRowProps) {
  const nm = nowMinutes()
  const resMins = hhmmToMinutes(r.time)

  const minsUntil = resMins - nm
  const isSoon = kind === "upcoming" && minsUntil <= 15

  const metaLine =
    kind === "seated"
      ? `${r.tables.join("+")} · PAX ${r.pax} · seated ${formatDurationShort(nm - resMins)}`
      : `${r.tables.join("+")} · PAX ${r.pax} · in ${Math.max(0, minsUntil)}m`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 border-t border-hair px-4 py-3",
        "text-left transition-colors hover:bg-card-elevated",
      )}
    >
      {/* Left accent bar */}
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px] opacity-50", accentBar)}
      />

      {/* Time */}
      <span
        className={cn(
          "w-11 shrink-0 text-sm font-medium [font-variant-numeric:tabular-nums]",
          accent,
        )}
      >
        {formatTime12(r.time)}
      </span>

      {/* Middle: name + meta */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] text-foreground">{r.name}</span>
          {r.vip && (
            <Crown className="size-3 shrink-0 text-brand-amber" strokeWidth={1.4} />
          )}
        </span>
        <span className="text-[10.5px] text-brand-ink-soft">{metaLine}</span>
      </span>

      {/* Soon badge */}
      {isSoon && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5",
            "bg-primary/10 text-primary",
            "text-[9px] font-medium uppercase tracking-[0.14em]",
          )}
        >
          Soon
        </span>
      )}
    </button>
  )
}

// ---------- Queue ----------

interface QueueProps {
  title: string
  subtitle: string
  items: Reservation[]
  kind: "seated" | "upcoming"
  accent: string
  accentBar: string
  accentDot: string
  onReservationClick: (r: Reservation) => void
}

function Queue({
  title,
  subtitle,
  items,
  kind,
  accent,
  accentBar,
  accentDot,
  onReservationClick,
}: QueueProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      {/* Section header */}
      <div className="flex items-baseline justify-between border-b border-hair px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", accentDot)} />
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground">
            {title}
          </span>
        </div>
        <span className="text-[10.5px] text-brand-ink-soft">{subtitle}</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-[11px] text-brand-ink-mute">
            Nothing here
          </div>
        ) : (
          items.map((r) => (
            <ResRow
              key={r.id}
              r={r}
              kind={kind}
              accent={accent}
              accentBar={accentBar}
              onClick={() => onReservationClick(r)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ---------- ServiceQueueList ----------

/**
 * Two-section scrollable list: "Seated Now" (red accent) and
 * "Upcoming" (amber accent). Purely presentational — callers handle
 * what happens when a row is clicked.
 */
export function ServiceQueueList({ feed, onReservationClick }: ServiceQueueListProps) {
  const seatedItems = feed.reservations
    .filter((r) => r.status === "seated")
    .sort((a, b) => a.time.localeCompare(b.time))

  const upcomingItems = feed.reservations
    .filter((r) => r.status === "booked")
    .sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Section A — Seated Now */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0 border-b border-hair">
        <Queue
          title="Seated Now"
          subtitle={`${seatedItems.length} tables`}
          items={seatedItems}
          kind="seated"
          accent="text-primary"
          accentBar="bg-primary"
          accentDot="bg-primary"
          onReservationClick={onReservationClick}
        />
      </div>

      {/* Section B — Upcoming */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <Queue
          title="Upcoming"
          subtitle={`${upcomingItems.length} upcoming`}
          items={upcomingItems}
          kind="upcoming"
          accent="text-brand-amber"
          accentBar="bg-brand-amber"
          accentDot="bg-brand-amber"
          onReservationClick={onReservationClick}
        />
      </div>
    </div>
  )
}
