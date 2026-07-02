import { cn } from "@/lib/utils"
import type { FloorTable } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { TableCell } from "./TableCell"

interface TablesSectionProps {
  title: string
  subtitle: string
  tables: FloorTable[]
  reservations: Reservation[]
  isMobile?: boolean
  canWalkIn: boolean
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  onTableHold: (tableId: string, turn: 1 | 2 | 3 | null) => void
}

export function TablesSection({
  title,
  subtitle,
  tables,
  reservations,
  isMobile,
  canWalkIn,
  onTableClick,
  onTableHold,
}: TablesSectionProps) {
  return (
    <section>
      <header className="mb-3.5 flex items-baseline gap-3">
        <h2 className="text-[17px] font-normal tracking-[0.04em] text-foreground">{title}</h2>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-mute">{subtitle}</span>
      </header>
      <div
        className={cn(
          "grid items-start gap-2.5",
          isMobile
            ? "grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
            : "grid-cols-[repeat(auto-fill,minmax(190px,1fr))]",
        )}
      >
        {tables.map((t) => (
          <TableCell
            key={t.id}
            table={t}
            reservations={reservations}
            isMobile={isMobile}
            canWalkIn={canWalkIn}
            onTap={onTableClick}
            onLongPress={onTableHold}
          />
        ))}
      </div>
    </section>
  )
}
