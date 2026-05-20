import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Overline } from "@/components/brand"
import { CounterChip } from "./CounterChip"
import { FilterChips, type StatusFilter } from "./FilterChips"
import { ResvCard } from "./ResvCard"
import { STATUS_STYLE } from "./statusStyle"
import type {
  DayFeed,
  Reservation,
  ReservationStatus,
} from "@/services/reservationsService"
import type { ActiveShift } from "./ShiftTabs"

interface ListPanelProps {
  feed: DayFeed
  activeShift: ActiveShift
  /** If true, drop the outer border + radius (used inside the mobile drawer). */
  embedded?: boolean
  onReservationClick: (r: Reservation) => void
}

function matchesShift(r: Reservation, shift: ActiveShift): boolean {
  return shift === "all" || r.shift === shift
}

function matchesStatus(r: Reservation, filter: StatusFilter): boolean {
  return filter === "all" || r.status === (filter as ReservationStatus)
}

export function ListPanel({ feed, activeShift, embedded, onReservationClick }: ListPanelProps) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<StatusFilter>("all")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return feed.reservations.filter((r) => {
      if (!matchesShift(r, activeShift)) return false
      if (!matchesStatus(r, filter)) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.tables.some((t) => t.toLowerCase().includes(q)) ||
        r.status.includes(q) ||
        STATUS_STYLE[r.status].label.toLowerCase().includes(q)
      )
    })
  }, [feed.reservations, activeShift, filter, query])

  const isFiltering = query.trim().length > 0 || filter !== "all"

  function clearFilters() {
    setQuery("")
    setFilter("all")
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-card",
        embedded ? "rounded-none border-0" : "rounded-[3px] border border-hair",
        "overflow-hidden",
      )}
    >
      {/* Sticky header (inside scroll container) */}
      <div className="border-b border-hair bg-card p-4">
        <Overline size="xs" tone="mute" className="mb-2.5 block">
          Today's service
        </Overline>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <CounterChip label="Reservations" value={feed.counters.reservations} accent />
          <CounterChip label="Guests" value={feed.counters.guests} />
          <CounterChip label="Walk-ins" value={feed.counters.walkIns} />
          <CounterChip
            label="Seated"
            value={feed.counters.seated}
            dotColor="var(--brand-red)"
          />
        </div>
        <div className="relative mb-2.5">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-ink-mute"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, or table…"
            className={cn(
              "h-9 w-full rounded-[3px] bg-foreground/[0.03] pl-8 pr-3 text-[12.5px] font-light",
              "border border-hair text-foreground placeholder:text-brand-ink-mute",
              "focus-visible:border-foreground focus-visible:outline-none",
            )}
          />
        </div>
        <FilterChips active={filter} onChange={setFilter} />
      </div>
      {/* Scrolling list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="text-[11px] tracking-[0.22em] uppercase text-brand-ink-mute">
              No reservations match{isFiltering ? " this filter" : ""}.
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilters}
                className={cn(
                  "rounded-full border border-hair-strong px-3 py-1",
                  "text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft",
                  "transition-colors duration-150 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          filtered.map((r) => (
            <ResvCard key={r.id} reservation={r} onReservationClick={onReservationClick} />
          ))
        )}
      </div>
    </aside>
  )
}
