import { BAR_TABLES } from "@/lib/tables"
import { BarSeat } from "./BarSeat"
import type { Reservation } from "@/services/reservationsService"

interface BarSectionProps {
  reservations: Reservation[]
  onTableClick: (tableId: string, resv?: Reservation) => void
}

export function BarSection({ reservations, onTableClick }: BarSectionProps) {
  return (
    <section>
      <header className="mb-3.5 flex items-baseline gap-3">
        <h2 className="text-[17px] font-normal tracking-[0.04em] text-foreground">
          Bar
        </h2>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-mute">
          14 seats along the chef's counter
        </span>
      </header>
      <div className="rounded-[3px] border border-hair bg-card p-5">
        <div
          aria-hidden
          className="mb-4 h-1.5 rounded-[3px] bg-[repeating-linear-gradient(90deg,oklch(0.186_0.013_270/0.08)_0_6px,transparent_6px_10px)]"
        />
        <div className="flex flex-wrap gap-2">
          {BAR_TABLES.map((s) => (
            <BarSeat
              key={s.id}
              seatId={s.id}
              reservations={reservations}
              onTableClick={onTableClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
