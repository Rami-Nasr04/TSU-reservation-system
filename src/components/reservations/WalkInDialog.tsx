import * as React from "react"
import { Minus, Plus, X, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { nowRounded15 } from "@/lib/dates"
import { bucketShift } from "@/services/reservationsService"
import type {
  DayFeed,
  Reservation,
  ReservationInput,
} from "@/services/reservationsService"
import { useFloorTables } from "@/contexts/TablesContext"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { MergeField } from "./MergeField"

const QUICK_PAX = [1, 2, 3, 4, 5, 6] as const

const SECTION_LABEL: Record<string, string> = {
  bar: "Bar",
  indoor: "Indoor",
  terrace: "Terrace",
}

interface WalkInDialogProps {
  open: boolean
  onClose: () => void
  date: string
  tableId: string
  /** Day feed — used to flag currently-seated siblings as Occupied in merge picker. */
  feed?: DayFeed | null
  /** Late-dinner seating turn from the tapped grid cell (null elsewhere). */
  turn?: 1 | 2 | 3 | null
  onSave: (r: Reservation, input: ReservationInput) => Promise<void>
}

export function WalkInDialog({
  open,
  onClose,
  date,
  tableId,
  feed,
  turn,
  onSave,
}: WalkInDialogProps) {
  const { getTable, getMergeableSiblings } = useFloorTables()
  const table = getTable(tableId)
  const subtitle = table
    ? `${SECTION_LABEL[table.section] ?? table.section} · Table ${table.id} (seats ${table.capacity})`
    : `Table ${tableId}`

  const [pax, setPax] = React.useState(2)
  const [notes, setNotes] = React.useState("")
  const [tables, setTables] = React.useState<string[]>([tableId])
  const [saving, setSaving] = React.useState(false)

  const siblings = React.useMemo(
    () => getMergeableSiblings(tableId),
    [getMergeableSiblings, tableId],
  )

  // Mark siblings currently held by a seated reservation as Occupied —
  // disabled in the picker so a walk-in can't merge onto an active table.
  const disabledSiblings = React.useMemo(() => {
    if (!feed) return {}
    const occupied: Record<string, string> = {}
    for (const r of feed.reservations) {
      if (r.status !== "seated") continue
      for (const t of r.tables) {
        if (siblings.includes(t)) occupied[t] = "Occupied"
      }
    }
    return occupied
  }, [feed, siblings])

  function handleClose() {
    if (saving) return
    setPax(2)
    setNotes("")
    setTables([tableId])
    onClose()
  }

  async function handleSave() {
    if (saving) return
    const time = nowRounded15()
    const reservation: Reservation = {
      id: `walkin-${Date.now()}`,
      time,
      name: "Walk-in",
      pax,
      tables,
      status: "seated",
      shift: bucketShift(time),
      turn: turn ?? null,
      isWalkIn: true,
      vip: false,
      notes: notes.trim() || undefined,
    }
    // Walk-ins are always anonymous on creation (locked decision). Customer
    // linking happens via the explicit "Add customer info" action on the
    // seated reservation — never auto-created from this dialog.
    const input: ReservationInput = {
      customer: null,
      customerId: null,
      date,
      start_time: time,
      pax,
      status: "seated",
      is_walk_in: true,
      turn: turn ?? null,
      occasion: null,
      notes: notes.trim() || null,
      total_bill: null,
      amount_paid: null,
      tables,
    }
    setSaving(true)
    try {
      await onSave(reservation, input)
    } catch {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="gap-0 p-0 sm:max-w-[480px]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 px-6 pt-6 pb-1 sm:px-7 sm:pt-7">
          <div className="flex-1">
            <div className="mb-1.5 inline-flex items-center gap-2">
              <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-primary/10 text-primary">
                <Zap size={11} strokeWidth={1.8} fill="currentColor" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-primary whitespace-nowrap">
                Fast entry
              </span>
            </div>
            <DialogTitle className="text-[22px] sm:text-[24px] font-normal tracking-[0.02em] leading-[1.1] text-foreground">
              Walk-in
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[12px] tracking-[0.04em] text-brand-ink-soft">
              {subtitle}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close"
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-[3px]",
              "text-brand-ink-soft hover:text-foreground hover:bg-foreground/[0.04]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <X size={16} strokeWidth={1.4} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-3 pt-6 sm:px-7 sm:pt-7">
          {/* Merge — only when the picked table has partners */}
          {siblings.length > 0 && (
            <div className="mb-7">
              <MergeField
                primaryTableId={tableId}
                selected={tables}
                onChange={setTables}
                siblings={siblings}
                disabled={saving}
                disabledSiblings={disabledSiblings}
              />
            </div>
          )}

          {/* PAX */}
          <div className="text-center mb-7">
            <div className="mb-5 text-[10px] font-medium uppercase tracking-[0.28em] text-brand-ink-soft">
              Party size
            </div>

            <div className="inline-flex items-center gap-3.5">
              <StepButton
                onClick={() => setPax((p) => Math.max(1, p - 1))}
                disabled={pax <= 1}
                ariaLabel="Decrease guests"
              >
                <Minus size={18} strokeWidth={1.8} />
              </StepButton>
              <div className="w-[120px] text-center text-[56px] font-extralight leading-none tracking-[0.02em] text-foreground tabular-nums">
                {pax}
              </div>
              <StepButton
                onClick={() => setPax((p) => Math.min(20, p + 1))}
                disabled={pax >= 20}
                ariaLabel="Increase guests"
              >
                <Plus size={18} strokeWidth={1.8} />
              </StepButton>
            </div>

            <div className="mt-2.5 text-[11px] uppercase tracking-[0.16em] text-brand-ink-mute">
              {pax === 1 ? "guest" : "guests"}
            </div>

            {/* Quick chips */}
            <div className="mt-4 inline-flex gap-1.5">
              {QUICK_PAX.map((n) => {
                const active = pax === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPax(n)}
                    aria-pressed={active}
                    className={cn(
                      "h-8 w-9 rounded-[3px] text-[13px] tracking-[0.02em]",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      active
                        ? "bg-primary text-primary-foreground border border-primary"
                        : "bg-transparent text-brand-ink-soft border border-hair hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes (optional) — name is intentionally omitted; walk-ins are
              anonymous on creation. */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="wi-notes"
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-brand-ink-soft"
              >
                Notes
              </label>
              <span className="text-[10.5px] tracking-[0.04em] text-brand-ink-mute">
                Optional · can skip
              </span>
            </div>
            <textarea
              id="wi-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Allergies, preferences…"
              className={cn(
                "w-full resize-none rounded-[3px] bg-card px-3.5 py-2.5",
                "text-[13px] font-light tracking-[0.02em] text-foreground",
                "border border-hair-strong placeholder:text-brand-ink-mute",
                "focus-visible:border-foreground focus-visible:outline-none",
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-hair bg-muted/40 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={cn(
              "h-11 rounded-[3px] px-[18px] text-[11px] font-medium uppercase tracking-[0.22em]",
              "border border-hair-strong text-foreground bg-transparent",
              "hover:border-foreground/30 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex-1 h-11 rounded-[3px] inline-flex items-center justify-center gap-2",
              "text-[11.5px] font-medium uppercase tracking-[0.22em]",
              "bg-primary text-primary-foreground",
              "hover:bg-brand-red-dark transition-colors duration-150",
              "shadow-[0_6px_18px_-6px_rgba(200,70,52,0.50)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Zap size={12} strokeWidth={1.8} fill="currentColor" />
            {saving ? "Seating…" : "Seat Now"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface StepButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  children: React.ReactNode
}

function StepButton({ onClick, disabled, ariaLabel, children }: StepButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "size-16 rounded-full inline-flex items-center justify-center",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        disabled
          ? "bg-foreground/[0.03] border border-hair text-brand-ink-mute cursor-not-allowed"
          : "bg-card border border-hair-strong text-foreground hover:border-foreground/30 shadow-[0_1px_2px_rgba(20,25,35,0.06)]",
      )}
    >
      {children}
    </button>
  )
}
