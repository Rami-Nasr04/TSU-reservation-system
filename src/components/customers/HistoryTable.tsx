import { cn } from "@/lib/utils"
import { formatTime12 } from "@/lib/dates"
import { StatusBadge } from "@/components/dayboard/StatusBadge"
import type { ReservationHistoryItem } from "@/services/customersService"
import { formatDayLabel, formatMoney } from "./format"

interface HistoryTableProps {
  items: ReservationHistoryItem[] | null
  isLoading: boolean
  error: string | null
}

export function HistoryTable({ items, isLoading, error }: HistoryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[3px] border border-hair px-4 py-6 text-center text-[11px] uppercase tracking-[0.2em] text-brand-ink-mute">
        Loading history…
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-[3px] border border-hair px-4 py-6 text-center text-[11.5px] text-brand-ink-soft">
        {error}
      </div>
    )
  }
  if (!items || items.length === 0) {
    return (
      <div className="rounded-[3px] border border-hair px-4 py-6 text-center text-[11px] uppercase tracking-[0.2em] text-brand-ink-mute">
        No reservations yet
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[3px] border border-hair">
      {items.map((h, i) => (
        <div
          key={h.id}
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5",
            i > 0 && "border-t border-hair",
          )}
        >
          <span className="w-[68px] shrink-0 text-[11.5px] tracking-[0.02em] text-brand-ink-soft">
            {formatDayLabel(h.date)}
          </span>
          <span className="w-[42px] shrink-0 text-[12.5px] tabular-nums text-foreground">
            {formatTime12(h.time)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-brand-ink-soft">
            {h.tables.length ? h.tables.join(" + ") : "—"} · PAX {h.pax}
          </span>
          <span className="shrink-0 text-[12.5px] tabular-nums text-foreground">
            {formatMoney(h.totalBill)}
          </span>
          <StatusBadge status={h.status} />
        </div>
      ))}
    </div>
  )
}
