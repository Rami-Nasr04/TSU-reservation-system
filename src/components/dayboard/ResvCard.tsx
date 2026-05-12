import { ChevronRight, Crown } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { StatusBadge, STATUS_STYLE } from "./StatusBadge"
import type { Reservation } from "@/services/reservationsService"

interface ResvCardProps {
  reservation: Reservation
}

export function ResvCard({ reservation: r }: ResvCardProps) {
  const past =
    r.status === "completed" || r.status === "cancelled" || r.status === "noshow"
  const meta = STATUS_STYLE[r.status]
  return (
    <button
      type="button"
      onClick={() =>
        toast.info("Reservation detail / edit lands in the next slice.")
      }
      className={cn(
        "group/resv relative w-full text-left",
        "flex items-stretch border-b border-hair bg-card",
        "pl-4 pr-3 py-3 hover:bg-muted/50 transition-colors duration-150",
        past && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 w-1", meta.barClass)}
      />
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-baseline gap-2.5">
          <span className="text-[17px] font-normal leading-none tracking-[0.02em] text-foreground">
            {r.time}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate text-[13.5px] font-normal tracking-[0.02em] text-foreground">
              {r.name}
            </span>
            {r.vip && (
              <Crown
                className="size-[11px] text-amber-600"
                aria-label="VIP"
              />
            )}
            {r.isWalkIn && (
              <span className="rounded-[2px] border border-hair-strong px-1 py-[1px] text-[9px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft">
                Walk-in
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11.5px] tracking-[0.04em] text-brand-ink-soft">
            {r.tables.join(" + ")} · PAX {r.pax}
          </span>
          <StatusBadge status={r.status} />
        </div>
      </div>
      <span className="flex items-center pl-2 text-brand-ink-mute group-hover/resv:text-foreground">
        <ChevronRight className="size-3.5" />
      </span>
    </button>
  )
}
