import { toast } from "sonner"
import { Crown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TableDef } from "@/lib/tables"
import type { Reservation } from "@/services/reservationsService"
import { deriveCellState, type CellState } from "./cellState"

interface TableButtonProps {
  def: TableDef
  reservations: Reservation[]
  isMobile?: boolean
}

export function TableButton({ def, reservations, isMobile }: TableButtonProps) {
  const { state, resv } = deriveCellState(def.id, reservations)

  const sizeClass = isMobile ? "size-[86px]" : "size-[116px]"
  const padClass = isMobile ? "p-2.5" : "p-3"

  const shellByState: Record<CellState, string> = {
    free:      "bg-card border border-dashed border-hair-strong text-brand-ink-soft",
    booked:    "bg-card border border-amber-700 dark:border-amber-300 text-foreground",
    seated:    "bg-primary/10 border-[1.5px] border-primary text-foreground",
    completed: "bg-foreground/[0.025] border border-hair text-brand-ink-mute opacity-80",
  }

  return (
    <button
      type="button"
      onClick={() =>
        toast.info(`Table ${def.id} — open reservation form (next slice).`)
      }
      title={`Table ${def.id} · seats ${def.capacity}${
        resv ? ` · ${resv.time} ${resv.name}` : ""
      }`}
      className={cn(
        "relative box-border flex flex-col justify-between rounded-[4px]",
        "font-light leading-none tracking-[0.02em]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "transition-colors duration-150",
        sizeClass,
        padClass,
        shellByState[state],
      )}
    >
      {state === "seated" && (
        <span
          aria-hidden
          className="absolute top-2 right-2 size-2 rounded-full bg-primary"
        />
      )}
      <div className="flex items-start justify-between">
        <div>
          <div
            className={cn(
              isMobile ? "text-[20px]" : "text-[24px]",
              state === "completed" && "line-through decoration-foreground/25",
            )}
          >
            {def.id}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.06em] text-brand-ink-mute">
            seats {def.capacity}
          </div>
        </div>
        {resv && resv.vip && state !== "seated" && (
          <Crown className="size-[11px] text-amber-600" aria-label="VIP" />
        )}
      </div>
      <div className="text-left">
        {state === "booked" && resv && (
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 tracking-[0.04em]">
            {resv.time}
            <div className="mt-0.5 truncate text-[10.5px] font-normal tracking-[0.02em] text-brand-ink-soft">
              {resv.name}
            </div>
          </div>
        )}
        {state === "seated" && resv && (
          <div className="text-[11px] font-medium text-primary tracking-[0.04em]">
            {resv.time}
            <div className="mt-0.5 truncate text-[10.5px] font-normal tracking-[0.02em] text-foreground">
              {resv.name}
            </div>
          </div>
        )}
        {state === "completed" && (
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-ink-mute">
            Done
          </div>
        )}
        {state === "free" && (
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-ink-mute">
            Free
          </div>
        )}
      </div>
    </button>
  )
}
