import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { nowRounded15 } from "@/lib/dates"
import { bucketShift } from "@/services/reservationsService"
import type { Reservation } from "@/services/reservationsService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface WalkInDialogProps {
  open: boolean
  onClose: () => void
  tableId: string
  onSave: (r: Reservation) => void
}

export function WalkInDialog({
  open,
  onClose,
  tableId,
  onSave,
}: WalkInDialogProps) {
  const [pax, setPax] = React.useState(2)
  const [name, setName] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function handleClose() {
    setPax(2)
    setName("")
    setNotes("")
    onClose()
  }

  function handleSave() {
    const time = nowRounded15()
    const reservation: Reservation = {
      id: `walkin-${Date.now()}`,
      time,
      name: name.trim() || "Walk-in",
      pax,
      tables: [tableId],
      status: "seated",
      shift: bucketShift(time),
      isWalkIn: true,
      vip: false,
      notes: notes.trim() || undefined,
    }
    onSave(reservation)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-[340px]"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-[13px] uppercase tracking-[0.22em] font-medium text-foreground">
            Walk-in · Table {tableId}
          </DialogTitle>
        </DialogHeader>

        {/* PAX stepper */}
        <div className="py-4 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute mb-1">
            Guests
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPax((p) => Math.max(1, p - 1))}
              aria-label="Decrease guests"
              className={cn(
                "size-10 rounded-full border border-hair-strong",
                "flex items-center justify-center",
                "text-brand-ink-soft hover:text-foreground hover:border-foreground/30",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-[36px] font-light leading-none text-foreground">
              {pax}
            </span>
            <button
              type="button"
              onClick={() => setPax((p) => Math.min(20, p + 1))}
              aria-label="Increase guests"
              className={cn(
                "size-10 rounded-full border border-hair-strong",
                "flex items-center justify-center",
                "text-brand-ink-soft hover:text-foreground hover:border-foreground/30",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Optional name */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="wi-name"
            className="text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute"
          >
            Name <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="wi-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Guest"
            className={cn(
              "h-9 w-full rounded-[3px] bg-foreground/[0.03] px-3 text-[12.5px] font-light",
              "border border-hair text-foreground placeholder:text-brand-ink-mute",
              "focus-visible:border-foreground focus-visible:outline-none",
            )}
          />
        </div>

        {/* Optional notes */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="wi-notes"
            className="text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute"
          >
            Notes <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="wi-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Allergies, preferences…"
            className={cn(
              "w-full resize-none rounded-[3px] bg-foreground/[0.03] px-3 py-2 text-[12.5px] font-light",
              "border border-hair text-foreground placeholder:text-brand-ink-mute",
              "focus-visible:border-foreground focus-visible:outline-none",
            )}
          />
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
            Seat Walk-in
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
