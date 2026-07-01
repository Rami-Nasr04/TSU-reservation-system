import { Crown, Cake, Heart, Briefcase, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import type { FloorTable } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { formatTime12 } from "@/lib/dates"
import { turnLabelSuffix, type TurnId } from "@/lib/turns"
import { useLongPress } from "@/hooks/useLongPress"
import { deriveCellState } from "./cellState"

const OCCASION_ICON = {
  birthday: Cake,
  anniversary: Heart,
  business: Briefcase,
  other: Sparkles,
} as const

interface TableCellProps {
  table: FloorTable
  reservations: Reservation[]
  turn?: TurnId
  isMobile?: boolean
  canWalkIn: boolean
  onTap: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  onLongPress: (tableId: string, turn: 1 | 2 | 3 | null) => void
}

/**
 * Universal floor cell. Compact when free; a rich rectangle (label · PAX · time ·
 * name · notes) when booked/seated. Used by TablesSection (no turn) and TurnGrid
 * (per turn). Long-press a free cell (when walk-ins are allowed) to seat a walk-in;
 * a thin fill sweeps during the hold. Service Mode inherits via the dark token cascade.
 */
export function TableCell({
  table,
  reservations,
  turn,
  isMobile,
  canWalkIn,
  onTap,
  onLongPress,
}: TableCellProps) {
  const { state, resv } = deriveCellState(table.id, reservations, turn)
  const cellTurn: 1 | 2 | 3 | null = turn ?? null
  const label = `#${table.id}${turn ? turnLabelSuffix(turn) : ""}`

  const isMerged = !!resv && resv.tables.length > 1
  const isSibling = isMerged && resv!.tables[0] !== table.id
  const primaryLabel = isMerged ? `#${resv!.tables[0]}` : ""
  const occupied = state === "booked" || state === "seated"

  const holdEnabled = canWalkIn && state === "free"
  const longPress = useLongPress({
    enabled: holdEnabled,
    onLongPress: () => onLongPress(table.id, cellTurn),
  })

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

  const OccIcon = resv?.occasion ? OCCASION_ICON[resv.occasion] : null

  return (
    <button
      type="button"
      onClick={() => {
        if (longPress.consumeClick()) return
        onTap(table.id, cellTurn, resv)
      }}
      onPointerDown={longPress.handlers.onPointerDown}
      onPointerUp={longPress.handlers.onPointerUp}
      onPointerLeave={longPress.handlers.onPointerLeave}
      onPointerCancel={longPress.handlers.onPointerCancel}
      title={`Table ${label} · seats ${table.capacity}${
        resv ? ` · ${formatTime12(resv.time)} ${resv.name || "Walk-in"}` : " · free"
      }`}
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[4px] text-left",
        "font-light leading-none tracking-[0.02em]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "transition-colors duration-150",
        occupied
          ? isMobile
            ? "min-h-[78px] gap-1 p-2"
            : "min-h-[86px] gap-1.5 p-2.5"
          : isMobile
            ? "min-h-[46px] gap-0.5 p-2"
            : "min-h-[52px] gap-1 p-2.5",
        shell,
      )}
    >
      {/* Hold progress fill (free cells only) */}
      {holdEnabled && longPress.progress > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 origin-left bg-primary/10"
          style={{ transform: `scaleX(${longPress.progress})` }}
        />
      )}

      {/* Top: label + capacity + PAX badge */}
      <div className="relative flex items-start justify-between gap-1">
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

      {/* Occupied detail: time + name + notes */}
      {occupied && resv && !isSibling && (
        <div className="relative min-w-0">
          <div
            className={cn(
              "text-[11px] font-medium tracking-[0.04em]",
              state === "seated" ? "text-primary" : "text-amber-700 dark:text-amber-300",
            )}
          >
            {formatTime12(resv.time)}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            {resv.vip && <Crown className="size-[11px] shrink-0 text-brand-gold" aria-label="VIP" />}
            {OccIcon && <OccIcon className="size-[11px] shrink-0 text-brand-ink-soft" aria-hidden />}
            <span className="truncate text-[11.5px] font-normal tracking-[0.02em] text-foreground">
              {resv.name || "Walk-in"}
            </span>
          </div>
          {resv.notes && (
            <div className="mt-0.5 truncate text-[10.5px] font-normal tracking-[0.02em] text-brand-ink-mute">
              {resv.notes}
            </div>
          )}
        </div>
      )}

      {/* Merged sibling tag */}
      {occupied && isSibling && (
        <div className="relative truncate text-[11px] font-normal tracking-[0.02em] text-brand-ink-mute">
          with {primaryLabel}
        </div>
      )}

      {/* Free */}
      {!occupied && (
        <div className="relative text-[10px] uppercase tracking-[0.18em] text-brand-ink-mute">
          Free
        </div>
      )}
    </button>
  )
}
