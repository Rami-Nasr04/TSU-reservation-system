import { Crown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { FloorTable } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { turnsForShift, turnLabelSuffix, type TurnId } from "@/lib/turns"
import { deriveCellState } from "./cellState"

interface TurnGridProps {
  tables: FloorTable[]
  reservations: Reservation[]
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
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
export function TurnGrid({ tables, reservations, onTableClick, isMobile }: TurnGridProps) {
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
        className="grid items-stretch gap-2"
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
            <TurnCell
              key={`${table.id}-${t.id}`}
              table={table}
              turn={t.id}
              reservations={reservations}
              onTableClick={onTableClick}
              isMobile={isMobile}
            />
          )),
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Cell
// ---------------------------------------------------------------------------

interface TurnCellProps {
  table: FloorTable
  turn: TurnId
  reservations: Reservation[]
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  isMobile?: boolean
}

function TurnCell({ table, turn, reservations, onTableClick, isMobile }: TurnCellProps) {
  const { state, resv } = deriveCellState(table.id, reservations, turn)
  const label = `#${table.id}${turnLabelSuffix(turn)}`

  // Merge: a sibling cell (not the primary table of a multi-table booking) shows a
  // muted "with #primary" tag instead of repeating the guest name.
  const isMerged = !!resv && resv.tables.length > 1
  const isSibling = isMerged && resv!.tables[0] !== table.id
  const primaryLabel = isMerged ? `#${resv!.tables[0]}` : ""

  const occupied = state === "booked" || state === "seated"

  const shell =
    state === "seated"
      ? "border-[1.5px] border-primary bg-primary/10 text-foreground"
      : state === "booked"
        ? "border border-amber-700 dark:border-amber-300 bg-amber-700/[0.06] text-foreground"
        : "border border-dashed border-hair-strong bg-card text-brand-ink-soft hover:border-foreground/30"

  const labelClass =
    state === "seated"
      ? "text-primary"
      : state === "booked"
        ? "text-amber-700 dark:text-amber-300"
        : "text-brand-ink-soft"

  return (
    <button
      type="button"
      onClick={() => onTableClick(table.id, turn, resv)}
      title={`Table ${label} · seats ${table.capacity}${
        resv ? ` · ${resv.time} ${resv.name}` : " · free"
      }`}
      className={cn(
        "relative flex min-w-0 flex-col rounded-[4px] text-left",
        "font-light leading-none tracking-[0.02em]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "transition-colors duration-150",
        isMobile ? "min-h-[62px] gap-1 p-2" : "min-h-[58px] gap-1.5 p-2.5",
        shell,
      )}
    >
      {/* Top: self-label + PAX badge */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className={cn(isMobile ? "text-[13px]" : "text-[14px]", labelClass)}>{label}</div>
          <div className="mt-0.5 text-[10px] tracking-[0.06em] text-brand-ink-mute">
            1–{table.capacity}
          </div>
        </div>
        {occupied && !isSibling && resv && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
              isMobile ? "size-[18px]" : "size-5",
              state === "seated"
                ? "bg-primary text-primary-foreground"
                : "bg-amber-700 text-white dark:bg-amber-300 dark:text-amber-950",
            )}
          >
            {resv.pax}
          </span>
        )}
      </div>

      {/* Bottom: guest name / merge tag / free hint */}
      <div className="min-w-0">
        {isSibling ? (
          <div className="truncate text-[11px] font-normal tracking-[0.02em] text-brand-ink-mute">
            with {primaryLabel}
          </div>
        ) : occupied && resv ? (
          <div className="flex items-center gap-1">
            {resv.vip && <Crown className="size-[11px] shrink-0 text-brand-gold" aria-label="VIP" />}
            <span className="truncate text-[11.5px] font-normal tracking-[0.02em] text-foreground">
              {resv.name || "Walk-in"}
            </span>
          </div>
        ) : (
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-ink-mute">Free</div>
        )}
      </div>
    </button>
  )
}
