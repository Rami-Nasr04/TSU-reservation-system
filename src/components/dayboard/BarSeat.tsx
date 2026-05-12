import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Reservation } from "@/services/reservationsService"
import { deriveCellState, type CellState } from "./cellState"

interface BarSeatProps {
  seatId: string
  reservations: Reservation[]
}

export function BarSeat({ seatId, reservations }: BarSeatProps) {
  const { state, resv } = deriveCellState(seatId, reservations)

  const shellByState: Record<CellState, string> = {
    free:      "bg-card border border-dashed border-hair-strong text-brand-ink-soft",
    booked:    "bg-card border border-amber-700 dark:border-amber-300 text-foreground",
    seated:    "bg-primary/10 border-[1.5px] border-primary text-foreground",
    completed: "bg-foreground/[0.025] border border-hair text-brand-ink-mute line-through",
  }

  return (
    <button
      type="button"
      onClick={() =>
        toast.info(`Bar ${seatId} — open reservation form (next slice).`)
      }
      title={`Bar ${seatId}${resv ? ` · ${resv.time} ${resv.name}` : ""}`}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full",
        "text-[13px] font-normal tracking-[0.02em]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        shellByState[state],
      )}
    >
      {seatId}
      {state === "seated" && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary"
        />
      )}
    </button>
  )
}
