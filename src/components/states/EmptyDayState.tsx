import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { isPastDate } from "@/lib/dates"

interface EmptyDayStateProps {
  /** YYYY-MM-DD of the day being viewed. Determines whether the CTA is shown. */
  date: string
  /** Triggered when the user creates a new reservation. Hidden on past days. */
  onNewReservation: () => void
}

export function EmptyDayState({ date, onNewReservation }: EmptyDayStateProps) {
  const past = isPastDate(date)

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div
        className={cn(
          "bg-card border border-hair rounded-[4px]",
          "w-[440px] max-w-full px-9 sm:px-11 pt-10 pb-8 text-center",
          "shadow-[0_12px_40px_-16px_rgba(20,25,35,0.18)]",
        )}
      >
        {/* Icon circle */}
        <div className="inline-flex items-center justify-center size-[52px] rounded-full bg-foreground/[0.04] text-brand-ink-soft mb-[18px]">
          <CalendarDays size={22} strokeWidth={1.4} />
        </div>

        {/* Overline */}
        <p className="text-[10px] font-medium tracking-[0.30em] uppercase text-brand-ink-soft mb-2.5">
          {past ? "Past day" : "Empty day"}
        </p>

        {/* Title */}
        <h2 className="text-[20px] font-normal tracking-[0.02em] text-foreground mb-2.5">
          No reservations
        </h2>

        {/* Description */}
        <p
          className={cn(
            "text-[12.5px] font-light leading-[1.6] tracking-[0.02em] text-brand-ink-soft",
            past ? "mb-0" : "mb-6",
          )}
        >
          {past
            ? "Nothing was booked for this date. View only."
            : "No one is booked for this date yet. Create a reservation to get started."}
        </p>

        {/* CTA — hidden on past days */}
        {!past && (
          <div className="inline-flex gap-2">
            <button
              type="button"
              onClick={onNewReservation}
              className={cn(
                "h-10 px-[18px] bg-primary text-primary-foreground rounded-[3px]",
                "text-[11px] font-medium tracking-[0.22em] uppercase",
                "hover:bg-brand-red-dark transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              New reservation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
