import type { FloorTable } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { turnsForShift } from "@/lib/turns"
import { TableCell } from "./TableCell"

interface TurnGridProps {
  tables: FloorTable[]
  reservations: Reservation[]
  canWalkIn: boolean
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  onTableHold: (tableId: string, turn: 1 | 2 | 3 | null) => void
  isMobile?: boolean
}

/**
 * Late-dinner Indoor turn grid: indoor tables (rows) × 3 seating turns (columns).
 * Each cell is one (table, turn) — self-labelled #20 / #20a / #20b so it reads
 * standalone. All three turn columns are always visible (no tabs, no horizontal
 * scroll); only the table rows scroll vertically. Service Mode reuses this via the
 * `[data-theme="service"]` token cascade — colors are semantic tokens (+ the same
 * amber `dark:` pair the floor-view buttons use for "booked").
 */
export function TurnGrid({ tables, reservations, canWalkIn, onTableClick, onTableHold, isMobile }: TurnGridProps) {
  const turns = turnsForShift("late")

  return (
    <section>
      <header className="mb-3.5 flex items-baseline gap-3">
        <h2 className="text-[17px] font-normal tracking-[0.04em] text-foreground">Indoor</h2>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-mute">
          {tables.length} tables · seating turns
        </span>
      </header>

      <div
        className="grid items-start gap-2"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {/* Column headers */}
        {turns.map((t) => (
          <div
            key={`head-${t.id}`}
            className="pb-1 text-center text-[11px] font-medium tracking-[0.08em] text-brand-ink-soft"
          >
            {t.label}
            <span className="text-brand-ink-mute">PM</span>
          </div>
        ))}

        {/* One row of cells per table (flows left→right across the 3 turn columns) */}
        {tables.map((table) =>
          turns.map((t) => (
            <TableCell
              key={`${table.id}-${t.id}`}
              table={table}
              turn={t.id}
              reservations={reservations}
              isMobile={isMobile}
              canWalkIn={canWalkIn}
              onTap={onTableClick}
              onLongPress={onTableHold}
            />
          )),
        )}
      </div>
    </section>
  )
}
