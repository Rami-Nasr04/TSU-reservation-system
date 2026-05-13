import * as React from "react"

import { cn } from "@/lib/utils"
import type { Reservation } from "@/services/reservationsService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface CheckoutDialogProps {
  open: boolean
  onClose: () => void
  reservation: Reservation
  onSave: (r: Reservation) => void
}

const INPUT_CLASS = cn(
  "h-9 w-full rounded-[3px] bg-foreground/[0.03] px-3 text-[12.5px] font-light",
  "border border-hair text-foreground placeholder:text-brand-ink-mute",
  "focus-visible:border-foreground focus-visible:outline-none",
)

const LABEL_CLASS = "text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute"

export function CheckoutDialog({
  open,
  onClose,
  reservation,
  onSave,
}: CheckoutDialogProps) {
  const [totalBill, setTotalBill] = React.useState("")
  const [amountPaid, setAmountPaid] = React.useState("")
  const [billInvalid, setBillInvalid] = React.useState(false)
  const [paidInvalid, setPaidInvalid] = React.useState(false)
  const billRef = React.useRef<HTMLInputElement>(null)

  const parsedBill = parseFloat(totalBill)
  const parsedPaid = parseFloat(amountPaid)
  const tip =
    totalBill !== "" && amountPaid !== "" && !isNaN(parsedBill) && !isNaN(parsedPaid)
      ? parsedPaid - parsedBill
      : null

  function handleClose() {
    onClose()
  }

  function validate(): boolean {
    let ok = true
    if (totalBill === "" || isNaN(parsedBill) || parsedBill < 0) {
      setBillInvalid(true)
      if (ok) billRef.current?.focus()
      ok = false
    } else {
      setBillInvalid(false)
    }
    if (amountPaid === "" || isNaN(parsedPaid) || parsedPaid < 0) {
      setPaidInvalid(true)
      ok = false
    } else {
      setPaidInvalid(false)
    }
    return ok
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      ...reservation,
      status: "completed",
      totalBill: parsedBill,
      amountPaid: parsedPaid,
      tip: parsedPaid - parsedBill,
    })
    handleClose()
  }

  const tableLabel =
    reservation.tables.length > 1
      ? `Tables ${reservation.tables.join(", ")}`
      : `Table ${reservation.tables[0] ?? ""}`

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[340px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-[13px] uppercase tracking-[0.22em] font-medium text-foreground">
            Checkout · {tableLabel}
          </DialogTitle>
        </DialogHeader>

        {/* Reservation summary */}
        <div className="rounded-[3px] border border-hair bg-foreground/[0.02] px-3 py-2.5">
          <p className="text-[12.5px] font-medium text-foreground">{reservation.name}</p>
          <p className="text-[11px] text-brand-ink-mute mt-0.5">
            {reservation.pax} {reservation.pax === 1 ? "guest" : "guests"} · {reservation.time}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="co-bill" className={LABEL_CLASS}>
              Total Bill
            </label>
            <input
              id="co-bill"
              ref={billRef}
              type="number"
              min="0"
              step="0.01"
              value={totalBill}
              onChange={(e) => {
                setTotalBill(e.target.value)
                if (billInvalid) setBillInvalid(false)
              }}
              placeholder="0.00"
              aria-invalid={billInvalid || undefined}
              className={cn(
                INPUT_CLASS,
                billInvalid && "border-destructive focus-visible:border-destructive",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="co-paid" className={LABEL_CLASS}>
              Amount Paid
            </label>
            <input
              id="co-paid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value)
                if (paidInvalid) setPaidInvalid(false)
              }}
              placeholder="0.00"
              aria-invalid={paidInvalid || undefined}
              className={cn(
                INPUT_CLASS,
                paidInvalid && "border-destructive focus-visible:border-destructive",
              )}
            />
          </div>

          {tip !== null && (
            <div className="flex items-center justify-between rounded-[3px] border border-hair-strong bg-foreground/[0.02] px-3 py-2">
              <span className={LABEL_CLASS}>Tip</span>
              <span
                className={cn(
                  "text-[13px] font-medium tabular-nums",
                  tip < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {tip >= 0 ? "+" : ""}
                {tip.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
              "border border-hair text-brand-ink-soft",
              "hover:text-foreground hover:border-foreground/30 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
              "bg-primary text-primary-foreground",
              "hover:bg-brand-red-dark transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            Complete Checkout
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
