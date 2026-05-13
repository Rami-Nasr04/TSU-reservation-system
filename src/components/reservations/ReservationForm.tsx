import * as React from "react"
import { Check, Crown, Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { reservationTimeSlots } from "@/lib/dates"
import { bucketShift } from "@/services/reservationsService"
import { lookupCustomer } from "@/services/customersService"
import type {
  Reservation,
  ReservationOccasion,
} from "@/services/reservationsService"
import { BAR_TABLES, INDOOR_TABLES, TERRACE_TABLES, getMergeableSiblings } from "@/lib/tables"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MergePicker } from "./MergePicker"

interface ReservationFormProps {
  open: boolean
  onClose: () => void
  date: string
  initialTableId?: string
  reservation?: Reservation
  onSave: (r: Reservation) => void
  onCheckout?: () => void
}

const INPUT_CLASS = cn(
  "h-9 w-full rounded-[3px] bg-foreground/[0.03] px-3 text-[12.5px] font-light",
  "border border-hair text-foreground placeholder:text-brand-ink-mute",
  "focus-visible:border-foreground focus-visible:outline-none",
)

const LABEL_CLASS = "text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute"

const SECTION_HEADER_CLASS = cn(
  "text-[10px] uppercase tracking-[0.22em] text-brand-ink-mute",
)

// Override shadcn SelectTrigger defaults to match the form's input style.
// !h-9 forces height over the component's data-[size=default]:h-8 conditional.
const SELECT_TRIGGER_CLASS = cn(
  "!h-9 w-full rounded-[3px] bg-foreground/[0.03] px-3 text-[12.5px] font-light",
  "border border-hair text-foreground",
  "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
)

const SELECT_CONTENT_CLASS = "rounded-[3px] border border-hair"
const SELECT_ITEM_CLASS = "text-[12.5px]"
const SELECT_LABEL_CLASS = "text-[10px] uppercase tracking-[0.18em] text-brand-ink-mute"

function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3) return iso
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

const DEFAULT_TIME = reservationTimeSlots()[4]

export function ReservationForm({
  open,
  onClose,
  date,
  initialTableId,
  reservation,
  onSave,
  onCheckout,
}: ReservationFormProps) {
  const isEdit = Boolean(reservation)

  const initialTables = React.useMemo<string[]>(() => {
    if (reservation) return reservation.tables
    if (initialTableId) return [initialTableId]
    return []
  }, [reservation, initialTableId])

  const [phone, setPhone] = React.useState<string>("")
  const [name, setName] = React.useState<string>(reservation?.name ?? "")
  const [email, setEmail] = React.useState<string>("")
  const [vip, setVip] = React.useState<boolean>(reservation?.vip ?? false)
  const [time, setTime] = React.useState<string>(
    reservation?.time ?? DEFAULT_TIME,
  )
  const [pax, setPax] = React.useState<number>(reservation?.pax ?? 2)
  const [tables, setTables] = React.useState<string[]>(initialTables)
  const [occasion, setOccasion] = React.useState<ReservationOccasion | "">(
    reservation?.occasion ?? "",
  )
  const [notes, setNotes] = React.useState<string>(reservation?.notes ?? "")
  const [nameInvalid, setNameInvalid] = React.useState(false)
  const [lookupFound, setLookupFound] = React.useState(false)

  const nameRef = React.useRef<HTMLInputElement>(null)
  // Snapshot refs let the phone lookup effect read current field values
  // without being in the effect deps (which would re-trigger on every auto-fill).
  const nameSnap = React.useRef(name)
  const emailSnap = React.useRef(email)
  const vipSnap = React.useRef(vip)

  // Writing to ref.current is only allowed outside render (in effects / handlers).
  React.useLayoutEffect(() => {
    nameSnap.current = name
    emailSnap.current = email
    vipSnap.current = vip
  })

  const slots = React.useMemo(() => reservationTimeSlots(), [])

  const primaryTableId = tables[0] ?? initialTableId ?? ""
  const mergeableAvailable = React.useMemo(
    () =>
      primaryTableId ? getMergeableSiblings(primaryTableId).length > 0 : false,
    [primaryTableId],
  )

  // Debounced customer lookup — only for new reservations.
  // setState calls are inside async callbacks (not synchronous in effect body).
  React.useEffect(() => {
    if (isEdit) return
    const timer = setTimeout(() => {
      const normalized = phone.replace(/[\s\-.()]/g, "")
      if (normalized.length < 8) {
        setLookupFound(false)
        return
      }
      void lookupCustomer(phone).then((customer) => {
        setLookupFound(Boolean(customer))
        if (customer) {
          if (!nameSnap.current.trim()) setName(customer.name)
          if (!emailSnap.current.trim() && customer.email) setEmail(customer.email)
          if (!vipSnap.current && customer.vip) setVip(true)
        }
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [phone, isEdit])

  function handleClose() {
    onClose()
  }

  function buildReservation(
    statusOverride?: Reservation["status"],
  ): Reservation {
    const baseId = reservation?.id ?? `res-${Date.now()}`
    const finalTables = tables.length > 0
      ? tables
      : initialTableId
        ? [initialTableId]
        : []
    return {
      id: baseId,
      time,
      name: name.trim(),
      pax,
      tables: finalTables,
      status: statusOverride ?? reservation?.status ?? "booked",
      shift: bucketShift(time),
      isWalkIn: reservation?.isWalkIn ?? false,
      vip,
      occasion: occasion === "" ? undefined : occasion,
      notes: notes.trim() === "" ? undefined : notes.trim(),
      totalBill: reservation?.totalBill,
      amountPaid: reservation?.amountPaid,
      tip: reservation?.tip,
    }
  }

  function validate(): boolean {
    if (name.trim() === "") {
      setNameInvalid(true)
      nameRef.current?.focus()
      return false
    }
    if (pax < 1) return false
    if (!time) return false
    setNameInvalid(false)
    return true
  }

  function handleSave() {
    if (!validate()) return
    onSave(buildReservation())
    handleClose()
  }

  function handleSeat() {
    if (!validate()) return
    onSave(buildReservation("seated"))
    handleClose()
  }

  function handleNoShow() {
    if (!reservation) return
    onSave({ ...reservation, status: "noshow" })
    handleClose()
  }

  function handleCancelReservation() {
    if (!reservation) return
    onSave(buildReservation("cancelled"))
    handleClose()
  }

  function handleCheckoutClick() {
    onCheckout?.()
  }

  const canCancelReservation =
    isEdit &&
    reservation !== undefined &&
    (reservation.status === "booked" || reservation.status === "seated")
  const canSeat = isEdit && reservation?.status === "booked"
  const canNoShow = isEdit && reservation?.status === "booked"
  const canCheckout = isEdit && reservation?.status === "seated"
  const isTerminal =
    isEdit &&
    (reservation?.status === "completed" ||
      reservation?.status === "cancelled" ||
      reservation?.status === "noshow")
  const hasLeftActions = canCancelReservation || canNoShow

  const title = isEdit
    ? `Edit — ${reservation?.name ?? ""}`
    : "New Reservation"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-[480px] overflow-y-auto max-h-[85dvh]"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-[13px] uppercase tracking-[0.22em] font-medium text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <section className="flex flex-col gap-3">
          <span className={SECTION_HEADER_CLASS}>Customer</span>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-phone" className={LABEL_CLASS}>
              Phone
            </label>
            <input
              id="rf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-XXX XXX"
              className={INPUT_CLASS}
            />
            {lookupFound && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <Check className="size-3" />
                Customer found
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-name" className={LABEL_CLASS}>
              Name
            </label>
            <input
              id="rf-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameInvalid && e.target.value.trim() !== "") {
                  setNameInvalid(false)
                }
              }}
              placeholder="Full name"
              aria-invalid={nameInvalid || undefined}
              className={cn(
                INPUT_CLASS,
                nameInvalid && "border-destructive focus-visible:border-destructive",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="rf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={INPUT_CLASS}
            />
          </div>

          <label
            htmlFor="rf-vip"
            className={cn(
              "flex items-center gap-2.5 py-1",
              "cursor-pointer select-none",
              "text-[12.5px] font-light text-foreground",
            )}
          >
            <Checkbox
              id="rf-vip"
              checked={vip}
              onCheckedChange={(v) => setVip(Boolean(v))}
            />
            <span className="flex items-center gap-1.5">
              Mark as VIP
              {vip && <Crown className="size-3.5 text-amber-500" />}
            </span>
          </label>
        </section>

        <section className="border-t border-hair pt-4 mt-4 flex flex-col gap-3">
          <span className={SECTION_HEADER_CLASS}>Booking</span>

          <div className="flex flex-col gap-1">
            <span className={LABEL_CLASS}>Date</span>
            <span className="text-[12.5px] text-brand-ink-soft">
              {formatDateLabel(date)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-time" className={LABEL_CLASS}>
              Time
            </label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="rf-time" className={SELECT_TRIGGER_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className={cn(SELECT_CONTENT_CLASS, "max-h-60")}
              >
                {slots.map((s) => (
                  <SelectItem key={s} value={s} className={SELECT_ITEM_CLASS}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className={LABEL_CLASS}>Guests</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPax((p) => Math.max(1, p - 1))}
                aria-label="Decrease guests"
                className={cn(
                  "size-9 rounded-full border border-hair-strong",
                  "flex items-center justify-center",
                  "text-brand-ink-soft hover:text-foreground hover:border-foreground/30",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                <Minus className="size-4" />
              </button>
              <span className="text-[28px] font-light w-8 text-center leading-none text-foreground">
                {pax}
              </span>
              <button
                type="button"
                onClick={() => setPax((p) => Math.min(20, p + 1))}
                aria-label="Increase guests"
                className={cn(
                  "size-9 rounded-full border border-hair-strong",
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

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-table" className={LABEL_CLASS}>
              Table
            </label>
            <Select
              value={tables[0] ?? "unassigned"}
              onValueChange={(v) => setTables(v === "unassigned" ? [] : [v])}
            >
              <SelectTrigger id="rf-table" className={SELECT_TRIGGER_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={SELECT_CONTENT_CLASS}>
                <SelectItem value="unassigned" className={cn(SELECT_ITEM_CLASS, "text-brand-ink-mute")}>
                  Unassigned
                </SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className={SELECT_LABEL_CLASS}>Bar</SelectLabel>
                  {BAR_TABLES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className={SELECT_ITEM_CLASS}>
                      Seat {t.id}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className={SELECT_LABEL_CLASS}>Indoor</SelectLabel>
                  {INDOOR_TABLES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className={SELECT_ITEM_CLASS}>
                      Table {t.id} · {t.capacity} seats
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className={SELECT_LABEL_CLASS}>Terrace</SelectLabel>
                  {TERRACE_TABLES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className={SELECT_ITEM_CLASS}>
                      Table {t.id} · {t.capacity} seats
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {tables.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tables.slice(1).map((t) => (
                  <span
                    key={t}
                    className="bg-foreground/[0.05] rounded-[4px] px-2 py-0.5 text-[12px] font-medium text-foreground"
                  >
                    +{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {mergeableAvailable && primaryTableId && (
          <MergePicker
            primaryTableId={primaryTableId}
            selectedTables={tables}
            onChange={setTables}
          />
        )}

        <section className="border-t border-hair pt-4 mt-4 flex flex-col gap-3">
          <span className={SECTION_HEADER_CLASS}>Details</span>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-occasion" className={LABEL_CLASS}>
              Occasion
            </label>
            <Select
              value={occasion || "none"}
              onValueChange={(v) =>
                setOccasion(v === "none" ? "" : (v as ReservationOccasion))
              }
            >
              <SelectTrigger id="rf-occasion" className={SELECT_TRIGGER_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className={SELECT_CONTENT_CLASS}>
                <SelectItem value="none" className={SELECT_ITEM_CLASS}>None</SelectItem>
                <SelectItem value="birthday" className={SELECT_ITEM_CLASS}>Birthday</SelectItem>
                <SelectItem value="anniversary" className={SELECT_ITEM_CLASS}>Anniversary</SelectItem>
                <SelectItem value="business" className={SELECT_ITEM_CLASS}>Business</SelectItem>
                <SelectItem value="other" className={SELECT_ITEM_CLASS}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="rf-notes" className={LABEL_CLASS}>
              Notes
            </label>
            <textarea
              id="rf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Allergies, preferences…"
              className={cn(
                "w-full resize-none rounded-[3px] bg-foreground/[0.03] px-3 py-2 text-[12.5px] font-light",
                "border border-hair text-foreground placeholder:text-brand-ink-mute",
                "focus-visible:border-foreground focus-visible:outline-none",
              )}
            />
          </div>
        </section>

        <DialogFooter
          className={cn(isEdit && hasLeftActions && "sm:justify-between")}
        >
          {isEdit ? (
            <>
              {/* Destructive / status-change actions — left side on desktop */}
              {hasLeftActions && (
                <div className="flex flex-wrap gap-2">
                  {canNoShow && (
                    <button
                      type="button"
                      onClick={handleNoShow}
                      className={cn(
                        "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
                        "border border-hair text-brand-ink-soft",
                        "hover:text-destructive hover:border-destructive/30 transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      )}
                    >
                      No-show
                    </button>
                  )}
                  {canCancelReservation && (
                    <button
                      type="button"
                      onClick={handleCancelReservation}
                      className={cn(
                        "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
                        "text-destructive border border-destructive/30",
                        "hover:bg-destructive/10 transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      )}
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              )}

              {/* Primary actions — right side */}
              <div className="flex gap-2 sm:justify-end">
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
                  Close
                </button>
                {!isTerminal && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className={cn(
                      "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
                      "border border-hair-strong text-foreground",
                      "hover:border-foreground/30 transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    )}
                  >
                    Update
                  </button>
                )}
                {canSeat && (
                  <button
                    type="button"
                    onClick={handleSeat}
                    className={cn(
                      "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
                      "bg-primary text-primary-foreground",
                      "hover:bg-brand-red-dark transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    )}
                  >
                    Seat
                  </button>
                )}
                {canCheckout && (
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className={cn(
                      "h-8 rounded-[3px] px-4 text-[10.5px] font-medium uppercase tracking-[0.18em]",
                      "bg-primary text-primary-foreground",
                      "hover:bg-brand-red-dark transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    )}
                  >
                    Checkout
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
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
                Save Reservation
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
