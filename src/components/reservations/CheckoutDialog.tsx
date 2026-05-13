import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  AlertTriangle,
  Check,
  Lock,
  Receipt,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getTable } from "@/lib/tables"
import type { Reservation } from "@/services/reservationsService"
import { DialogOverlay, DialogTitle } from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface CheckoutDialogProps {
  open: boolean
  onClose: () => void
  reservation: Reservation
  onSave: (r: Reservation) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeMoney(raw: string): string {
  const v = raw.replace(/[^0-9.]/g, "")
  const parts = v.split(".")
  if (parts.length <= 1) return v
  return parts[0] + "." + parts.slice(1).join("").slice(0, 2)
}

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function tableLabel(tables: string[]): string {
  if (tables.length === 0) return "Unassigned"
  if (tables.length === 1) {
    const def = getTable(tables[0])
    return def?.section === "bar" ? `Seat ${tables[0]}` : `Table ${tables[0]}`
  }
  return `Tables ${tables.join("+")}`
}

function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number)
  return { h: h || 0, m: m || 0 }
}

function durationSince(seatedTime: string): string {
  const { h, m } = parseTime(seatedTime)
  const now = new Date()
  const startMin = h * 60 + m
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let diff = nowMin - startMin
  if (diff < 0) diff += 24 * 60
  if (diff < 1) return "just now"
  const hh = Math.floor(diff / 60)
  const mm = diff % 60
  if (hh === 0) return `${mm}m`
  return `${hh}h ${mm}m`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CheckoutDialog({
  open,
  onClose,
  reservation,
  onSave,
}: CheckoutDialogProps) {
  const locked = reservation.status === "completed"

  // Use existing reservation values if the dialog is opened on a completed reservation.
  const [total, setTotal] = React.useState<string>(
    reservation.totalBill !== undefined ? String(reservation.totalBill) : "",
  )
  const [paid, setPaid] = React.useState<string>(
    reservation.amountPaid !== undefined ? String(reservation.amountPaid) : "",
  )
  const [notes, setNotes] = React.useState<string>("")
  const [focusField, setFocusField] = React.useState<"total" | "paid" | null>(null)

  const totalRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open || locked) return
    const t = setTimeout(() => totalRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open, locked])

  const totalN = parseFloat(total) || 0
  const paidN = parseFloat(paid) || 0
  const hasBoth = total !== "" && paid !== ""
  const tip = hasBoth ? +(paidN - totalN).toFixed(2) : null
  const tipPct = hasBoth && totalN > 0 ? (tip! / totalN) * 100 : null
  const underpaid = tip !== null && tip < 0
  const exact = tip !== null && Math.abs(tip) < 0.005
  const canSubmit = hasBoth && !underpaid

  function handleSubmit() {
    if (!canSubmit || locked) return
    onSave({
      ...reservation,
      status: "completed",
      totalBill: totalN,
      amountPaid: paidN,
      tip: tip ?? 0,
      notes: notes.trim()
        ? reservation.notes
          ? `${reservation.notes}\n— Checkout: ${notes.trim()}`
          : notes.trim()
        : reservation.notes,
    })
    onClose()
  }

  const seatedAt = reservation.time
  const duration = durationSince(seatedAt)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogOverlay className="bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-card text-foreground outline-none",
            // Mobile bottom-sheet
            "inset-x-0 bottom-0 top-[8dvh] rounded-t-[16px] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.30)]",
            // Desktop centered modal
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:w-[calc(100%-2rem)] sm:max-w-[520px] sm:max-h-[92dvh] sm:rounded-[4px] sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.40)]",
            // Animations
            "data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0",
            "data-open:slide-in-from-bottom-2 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95",
          )}
        >
          {/* Mobile drag handle */}
          <div className="flex shrink-0 justify-center pt-2 sm:hidden">
            <div className="h-1 w-11 rounded-full bg-foreground/20" />
          </div>

          <DialogTitle className="sr-only">Check out reservation</DialogTitle>

          {/* Header */}
          <Header
            locked={locked}
            guestName={reservation.name}
            tableLabel={tableLabel(reservation.tables)}
            pax={reservation.pax}
            onClose={onClose}
          />

          {/* Seating meta strip */}
          <div className="shrink-0 px-[22px] pt-[18px] sm:px-7 sm:pt-5">
            <div className="flex items-stretch rounded-[3px] border border-hair bg-foreground/[0.015]">
              <MetaCell label="Seated" value={seatedAt} />
              <MetaDivider />
              <MetaCell label="Duration" value={duration} />
              <MetaDivider />
              <MetaCell
                label="Occasion"
                value={occasionLabel(reservation.occasion)}
                muted={!reservation.occasion}
              />
            </div>
          </div>

          {/* Body (scrolling) */}
          <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-6 pb-2 sm:px-7">
            {/* Currency inputs */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              <CurrencyInput
                label="Total bill"
                inputRef={totalRef}
                value={total}
                onChange={(v) => setTotal(sanitizeMoney(v))}
                focused={focusField === "total"}
                onFocus={() => setFocusField("total")}
                onBlur={() => setFocusField(null)}
                disabled={locked}
              />
              <CurrencyInput
                label="Amount paid"
                value={paid}
                onChange={(v) => setPaid(sanitizeMoney(v))}
                focused={focusField === "paid"}
                onFocus={() => setFocusField("paid")}
                onBlur={() => setFocusField(null)}
                disabled={locked}
              />
            </div>

            {/* Tip row */}
            <TipRow
              tip={tip}
              tipPct={tipPct}
              underpaid={underpaid}
              exact={exact}
              hasBoth={hasBoth}
            />

            {/* Notes */}
            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-brand-ink-soft">
                  Notes for the record
                </span>
                <span className="text-[10.5px] tracking-[0.04em] text-brand-ink-mute">
                  Optional
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. shared dessert · ran late · 2 bottles wine"
                rows={2}
                disabled={locked}
                className={cn(
                  "w-full resize-none rounded-[3px] border border-hair-strong px-3.5 py-3",
                  "text-[13px] font-light leading-relaxed tracking-[0.01em] text-foreground",
                  "placeholder:text-brand-ink-mute focus-visible:border-foreground focus-visible:outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06] transition-colors",
                  locked ? "bg-foreground/[0.025]" : "bg-card",
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <Footer
            locked={locked}
            canSubmit={canSubmit}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function occasionLabel(o: Reservation["occasion"]): string {
  if (!o) return "—"
  return o[0].toUpperCase() + o.slice(1)
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  locked,
  guestName,
  tableLabel,
  pax,
  onClose,
}: {
  locked: boolean
  guestName: string
  tableLabel: string
  pax: number
  onClose: () => void
}) {
  return (
    <div className="flex shrink-0 items-start gap-2.5 px-[22px] pt-5 pb-0 sm:px-7 sm:pt-6">
      <div className="min-w-0 flex-1">
        <div className="mb-2 inline-flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-[22px] items-center justify-center rounded-full",
              locked ? "bg-foreground/[0.06]" : "bg-primary/10",
            )}
          >
            {locked ? (
              <Lock className="size-3 text-brand-ink-soft" strokeWidth={1.4} />
            ) : (
              <Receipt className="size-3 text-primary" strokeWidth={1.4} />
            )}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium tracking-[0.28em] uppercase whitespace-nowrap",
              locked ? "text-brand-ink-soft" : "text-primary",
            )}
          >
            {locked ? "Completed" : "Closing out"}
          </span>
        </div>
        <div className="text-[22px] font-normal leading-tight tracking-[0.02em] text-foreground sm:text-[24px]">
          Check Out
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] tracking-[0.02em]">
          <span className="font-normal text-foreground">{guestName}</span>
          <span className="text-brand-ink-mute">·</span>
          <span className="text-brand-ink-soft">{tableLabel}</span>
          <span className="text-brand-ink-mute">·</span>
          <span className="text-brand-ink-soft">
            {pax} {pax === 1 ? "guest" : "guests"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[3px] text-foreground",
          "transition-colors hover:bg-foreground/[0.05]",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10",
        )}
      >
        <X className="size-4" strokeWidth={1.4} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meta cells
// ---------------------------------------------------------------------------

function MetaCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex-1 px-3 py-2.5 sm:px-3.5 sm:py-3">
      <div className="mb-1 text-[9.5px] font-medium tracking-[0.22em] uppercase text-brand-ink-mute">
        {label}
      </div>
      <div
        className={cn(
          "text-[13.5px] font-normal tabular-nums",
          muted ? "text-brand-ink-mute" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function MetaDivider() {
  return <div className="w-px self-stretch bg-hair" />
}

// ---------------------------------------------------------------------------
// Currency input
// ---------------------------------------------------------------------------

function CurrencyInput({
  label,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  disabled,
  inputRef,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-medium tracking-[0.22em] uppercase text-brand-ink-soft">
        {label}
      </div>
      <div
        className={cn(
          "relative rounded-[3px] border transition-colors",
          focused ? "border-foreground" : "border-hair-strong",
          focused && "ring-[3px] ring-foreground/[0.05]",
          disabled ? "bg-foreground/[0.025]" : "bg-card",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-light tracking-[0.01em] tabular-nums",
            "text-[20px]",
            value ? "text-foreground" : "text-brand-ink-mute",
          )}
        >
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="0.00"
          className={cn(
            "h-14 w-full bg-transparent pr-3.5 pl-8 sm:h-16",
            "text-[24px] font-light tracking-[0.01em] tabular-nums text-foreground sm:text-[26px]",
            "outline-none placeholder:text-brand-ink-mute",
            disabled && "cursor-not-allowed",
          )}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tip row
// ---------------------------------------------------------------------------

function TipRow({
  tip,
  tipPct,
  underpaid,
  exact,
  hasBoth,
}: {
  tip: number | null
  tipPct: number | null
  underpaid: boolean
  exact: boolean
  hasBoth: boolean
}) {
  const idle = !hasBoth

  return (
    <div
      className={cn(
        "mt-3 flex items-center justify-between gap-4 rounded-[3px] border px-4 py-3.5 transition-colors duration-150 sm:px-[18px] sm:py-4",
        idle && "border-hair bg-foreground/[0.025]",
        !idle && underpaid && "border-primary/30 bg-primary/[0.06]",
        !idle && !underpaid && "border-primary/20 bg-primary/[0.05]",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium tracking-[0.28em] uppercase",
              idle ? "text-brand-ink-mute" : "text-brand-ink-soft",
            )}
          >
            Tip
          </span>
          {hasBoth && !underpaid && !exact && tipPct !== null && (
            <span className="text-[10px] font-medium tracking-[0.06em] tabular-nums text-brand-ink-soft">
              · {tipPct.toFixed(1)}%
            </span>
          )}
          {exact && (
            <span className="text-[10px] font-medium tracking-[0.06em] text-brand-ink-soft">
              · exact
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] tracking-[0.02em] text-brand-ink-mute">
          {idle
            ? "Enter both amounts to calculate"
            : underpaid
              ? "Paid is less than bill total"
              : exact
                ? "No tip · paid matches bill exactly"
                : "Auto-calculated · paid − bill"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {underpaid && (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-primary px-2 py-1 text-[9.5px] font-medium tracking-[0.22em] uppercase text-primary-foreground">
            <AlertTriangle className="size-2.5" strokeWidth={1.6} />
            Underpaid
          </span>
        )}
        <div
          className={cn(
            "text-[26px] font-light leading-none tracking-[0.01em] tabular-nums whitespace-nowrap sm:text-[28px]",
            idle && "text-brand-ink-mute",
            !idle && underpaid && "text-primary",
            !idle && !underpaid && "text-foreground",
          )}
        >
          {idle ? "—" : `${tip! < 0 ? "−" : ""}$${formatUSD(Math.abs(tip!))}`}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({
  locked,
  canSubmit,
  onSubmit,
  onClose,
}: {
  locked: boolean
  canSubmit: boolean
  onSubmit: () => void
  onClose: () => void
}) {
  if (locked) {
    return (
      <div className="flex shrink-0 items-center gap-2.5 border-t border-hair bg-card px-[18px] py-3.5 sm:px-6 sm:py-4">
        <div className="inline-flex flex-1 items-center gap-2 text-brand-ink-soft">
          <Lock className="size-[13px]" strokeWidth={1.4} />
          <span className="text-[11px] tracking-[0.18em] uppercase">
            Reservation locked
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "h-10 rounded-[3px] border border-hair-strong bg-card px-5 text-[11px] font-medium tracking-[0.22em] uppercase text-foreground sm:h-11",
            "transition-colors hover:bg-foreground/[0.04]",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10",
          )}
        >
          Close
        </button>
      </div>
    )
  }
  return (
    <div className="flex shrink-0 gap-2 border-t border-hair bg-card px-[18px] py-3.5 sm:px-6 sm:py-4">
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "h-12 rounded-[3px] border border-hair-strong bg-card px-5 text-[11px] font-medium tracking-[0.22em] uppercase text-foreground sm:h-[46px]",
          "transition-colors hover:bg-foreground/[0.04]",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10",
        )}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          "inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-[3px] text-[12px] font-medium tracking-[0.22em] uppercase",
          "transition-all duration-150 sm:h-[46px] sm:text-[11.5px]",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
          canSubmit
            ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_oklch(0.572_0.165_28.5/0.50)] hover:bg-brand-red-dark"
            : "cursor-not-allowed bg-primary/35 text-primary-foreground",
        )}
      >
        <Check className="size-[13px]" strokeWidth={1.6} />
        Complete Reservation
      </button>
    </div>
  )
}
