import * as React from "react"
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive } from "radix-ui"
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Mail,
  Minus,
  Phone,
  Plus,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react"

import { toast } from "sonner"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { formatDateISO, isPastDayLocked, parseDateISO, reservationTimeSlots } from "@/lib/dates"
import { checkMergeAvailability } from "@/lib/reservationConflicts"
import { bucketShift } from "@/services/reservationsService"
import { lookupCustomer } from "@/services/customersService"
import type {
  DayFeed,
  Reservation,
  ReservationInput,
  ReservationOccasion,
  ReservationStatus,
} from "@/services/reservationsService"
import { useFloorTables, type FloorTable } from "@/contexts/TablesContext"
import { DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { MergeField } from "./MergeField"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface ReservationFormProps {
  open: boolean
  onClose: () => void
  date: string
  /** Day feed — used to keep yesterday editable while a seated row is still active. */
  feed?: DayFeed | null
  initialTableId?: string
  reservation?: Reservation
  onSave: (r: Reservation, input: ReservationInput) => Promise<void>
  onCheckout?: () => void
}

// ---------------------------------------------------------------------------
// Tokens & helpers
// ---------------------------------------------------------------------------

const LABEL = "block text-[10px] font-medium tracking-[0.22em] uppercase text-brand-ink-soft"

const OCCASION_OPTIONS: Array<{ value: ReservationOccasion | ""; label: string }> = [
  { value: "", label: "None" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
]

const DEFAULT_TIME = reservationTimeSlots()[4] // 13:00

function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3) return iso
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function shiftLabel(shift: "lunch" | "afternoon" | "late"): string {
  return shift === "lunch" ? "Lunch" : shift === "afternoon" ? "Afternoon" : "Late Dinner"
}

function tableSubtitle(
  tables: string[],
  getTable: (label: string) => FloorTable | undefined,
): string {
  if (tables.length === 0) return "Unassigned"
  const def = getTable(tables[0])
  if (!def) return `Table ${tables[0]}`
  const section = def.section[0].toUpperCase() + def.section.slice(1)
  if (tables.length === 1) {
    const seatLabel = def.section === "bar" ? "1 seat" : `seats ${def.capacity}`
    return `${section} · Table ${tables[0]} (${seatLabel})`
  }
  const totalSeats = tables.reduce((s, t) => s + (getTable(t)?.capacity ?? 0), 0)
  return `${section} · Tables ${tables.join("+")} (seats ${totalSeats} merged)`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReservationForm({
  open,
  onClose,
  date: propDate,
  feed,
  initialTableId,
  reservation,
  onSave,
  onCheckout,
}: ReservationFormProps) {
  const isEdit = Boolean(reservation)
  const { getMergeableSiblings } = useFloorTables()
  const [date, setDate] = React.useState<string>(propDate)

  // ---- form state ---------------------------------------------------------
  const initialTables = React.useMemo<string[]>(() => {
    if (reservation) return reservation.tables
    if (initialTableId) return [initialTableId]
    return []
  }, [reservation, initialTableId])

  const [name, setName] = React.useState<string>(reservation?.name ?? "")
  const [phone, setPhone] = React.useState<string>(reservation?.customerPhone ?? "")
  const [email, setEmail] = React.useState<string>(reservation?.customerEmail ?? "")
  const [vip, setVip] = React.useState<boolean>(reservation?.vip ?? false)
  const [time, setTime] = React.useState<string>(reservation?.time ?? DEFAULT_TIME)
  const [pax, setPax] = React.useState<number>(reservation?.pax ?? 2)
  const [tables, setTables] = React.useState<string[]>(initialTables)
  const [occasion, setOccasion] = React.useState<ReservationOccasion | "">(
    reservation?.occasion ?? "",
  )
  const [notes, setNotes] = React.useState<string>(reservation?.notes ?? "")
  const [nameInvalid, setNameInvalid] = React.useState(false)
  const [tableInvalid, setTableInvalid] = React.useState(false)
  const [lookupHit, setLookupHit] = React.useState<{
    name: string
    visits: number
    vip: boolean
  } | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const nameRef = React.useRef<HTMLInputElement>(null)

  // Snapshot refs let the phone lookup effect read current field values
  // without putting them in the deps array (would re-trigger on every fill).
  const nameSnap = React.useRef(name)
  const emailSnap = React.useRef(email)
  const vipSnap = React.useRef(vip)
  React.useLayoutEffect(() => {
    nameSnap.current = name
    emailSnap.current = email
    vipSnap.current = vip
  })

  // Debounced customer lookup — only for new reservations.
  React.useEffect(() => {
    if (isEdit) return
    const timer = setTimeout(() => {
      const normalized = phone.replace(/[\s\-.()]/g, "")
      if (normalized.length < 8) {
        setLookupHit(null)
        return
      }
      void lookupCustomer(phone).then((customer) => {
        if (customer) {
          setLookupHit({
            name: customer.name,
            visits: customer.visitCount,
            vip: customer.vip,
          })
          if (!nameSnap.current.trim()) setName(customer.name)
          if (!emailSnap.current.trim() && customer.email) setEmail(customer.email)
          if (!vipSnap.current && customer.vip) setVip(true)
        } else {
          setLookupHit(null)
        }
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [phone, isEdit])

  // ---- derived ------------------------------------------------------------
  const slots = React.useMemo(() => reservationTimeSlots(), [])
  const primaryTableId = tables[0] ?? ""
  const mergeable = React.useMemo(
    () => (primaryTableId ? getMergeableSiblings(primaryTableId) : []),
    [primaryTableId, getMergeableSiblings],
  )
  const computedShift = bucketShift(time)
  const status = reservation?.status

  // Past-day-locked overrides every other gate: the whole form is view-only.
  const isLocked = isPastDayLocked(date, feed)

  // Live transitions on booked/seated reservations.
  const canCancel = isEdit && !isLocked && (status === "booked" || status === "seated")
  const canSeat = isEdit && !isLocked && status === "booked"
  const canNoShow = isEdit && !isLocked && status === "booked"
  const canCheckout = isEdit && !isLocked && status === "seated"

  // Recovery transitions from terminal statuses (operational-day editable only).
  const canRebook = isEdit && !isLocked && (status === "cancelled" || status === "noshow")
  const canMarkSeatedFromTerminal =
    isEdit && !isLocked && (status === "cancelled" || status === "noshow")
  const canReopen = isEdit && !isLocked && status === "completed"

  // ---- handlers -----------------------------------------------------------
  function buildReservation(statusOverride?: ReservationStatus): Reservation {
    const baseId = reservation?.id ?? `res-${Date.now()}`
    const finalTables =
      tables.length > 0 ? tables : initialTableId ? [initialTableId] : []
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

  function buildInput(statusOverride?: ReservationStatus): ReservationInput {
    const finalTables =
      tables.length > 0 ? tables : initialTableId ? [initialTableId] : []
    return {
      // New bookings upsert the customer from the form; edits preserve the
      // existing link (customer editing lives in the P3 CRM, not here).
      customer: isEdit
        ? null
        : {
            name: name.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            vip,
          },
      customerId: reservation?.customerId ?? null,
      date,
      start_time: time,
      pax,
      status: statusOverride ?? reservation?.status ?? "booked",
      is_walk_in: reservation?.isWalkIn ?? false,
      occasion: occasion === "" ? null : occasion,
      notes: notes.trim() || null,
      total_bill: reservation?.totalBill ?? null,
      amount_paid: reservation?.amountPaid ?? null,
      tables: finalTables,
    }
  }

  function validate(): boolean {
    let ok = true
    if (name.trim() === "") {
      setNameInvalid(true)
      nameRef.current?.focus()
      ok = false
    } else {
      setNameInvalid(false)
    }
    if (tables.length === 0 && !initialTableId) {
      setTableInvalid(true)
      ok = false
    } else {
      setTableInvalid(false)
    }
    if (pax < 1) ok = false
    if (!time) ok = false
    return ok
  }

  // Sync-await: stays open during the call, parent closes on success and shows
  // the toast; on failure we re-enable the buttons so the host can retry.
  async function submit(statusOverride?: ReservationStatus, requireValid = true) {
    if (saving) return
    if (requireValid && !validate()) return

    // Frontend pre-flight for merge overlaps. Only runs when the target status
    // will hold a table (booked/seated) and the row has at least one merge
    // sibling — terminal transitions skip this and rely on the backend.
    const targetStatus: ReservationStatus =
      statusOverride ?? reservation?.status ?? "booked"
    if (
      (targetStatus === "booked" || targetStatus === "seated") &&
      tables.length > 1
    ) {
      const conflict = checkMergeAvailability(
        date,
        time,
        tables,
        feed ?? null,
        new Date(),
        reservation?.id,
      )
      if (!conflict.ok) {
        toast.error(conflict.reason)
        return
      }
    }

    setSaving(true)
    try {
      await onSave(buildReservation(statusOverride), buildInput(statusOverride))
    } catch {
      setSaving(false)
    }
  }

  function handleSave() {
    void submit()
  }
  function handleSeat() {
    void submit("seated")
  }
  function handleNoShow() {
    if (!reservation) return
    void submit("noshow", false)
  }
  function handleCancelReservation() {
    if (!reservation) return
    void submit("cancelled", false)
  }
  function handleCheckoutClick() {
    onCheckout?.()
  }
  function handleRebook() {
    if (!reservation) return
    void submit("booked", false)
  }
  function handleMarkSeatedFromTerminal() {
    if (!reservation) return
    void submit("seated", false)
  }
  function handleReopen() {
    if (!reservation) return
    void submit("seated", false)
  }

  // Wrap close so ESC / outside-click / X-button can't dismiss mid-save and
  // leave a "ghost" toast firing after the modal is gone.
  function safeClose() {
    if (saving) return
    onClose()
  }

  // ---- render -------------------------------------------------------------
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && safeClose()}>
      <DialogPrimitive.Portal>
        <DialogOverlay className="bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-card text-foreground outline-none",
            // Mobile: bottom-sheet (full width, top 15%)
            "inset-x-0 bottom-0 top-[15dvh] rounded-t-[14px] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.30)]",
            // Desktop+: centered modal
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:w-[calc(100%-2rem)] sm:max-w-[620px] sm:max-h-[92dvh] sm:rounded-[4px] sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.40)]",
            // Animations
            "data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0",
            "data-open:slide-in-from-bottom-2 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95",
          )}
        >
          {/* Mobile drag handle */}
          <div className="flex shrink-0 justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>

          {/* Header */}
          <Header
            isEdit={isEdit}
            tables={tables.length > 0 ? tables : initialTableId ? [initialTableId] : []}
            onClose={safeClose}
          />

          {/* Scrolling body */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-brand-paper-warm px-[22px] py-5 sm:px-7 sm:py-6">
            {isEdit && status && (
              <>
                <StatusStrip
                  status={status}
                  saving={saving}
                  onSeat={canSeat ? handleSeat : undefined}
                  onCheckout={canCheckout ? handleCheckoutClick : undefined}
                  onNoShow={canNoShow ? handleNoShow : undefined}
                  onCancel={canCancel ? handleCancelReservation : undefined}
                  onRebook={canRebook ? handleRebook : undefined}
                  onMarkSeatedFromTerminal={
                    canMarkSeatedFromTerminal ? handleMarkSeatedFromTerminal : undefined
                  }
                  onReopen={canReopen ? handleReopen : undefined}
                />
                {canReopen && (
                  <p className="-mt-3 mb-5 text-[10.5px] tracking-[0.04em] text-brand-ink-soft">
                    Reverts to seated. Use to edit totals.
                  </p>
                )}
              </>
            )}

            <div className="flex flex-col gap-[18px]">
              {/* Date + Time row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField
                  value={date}
                  onChange={setDate}
                  disabled={isLocked}
                />
                <TimeField
                  value={time}
                  onChange={setTime}
                  slots={slots}
                  shift={shiftLabel(computedShift)}
                  disabled={isLocked}
                />
              </div>

              {/* PAX + VIP row */}
              <div className="flex flex-wrap items-end gap-x-7 gap-y-4">
                <PaxStepper value={pax} onChange={setPax} disabled={isLocked} />
                <VipToggle value={vip} onChange={setVip} disabled={isLocked} />
              </div>

              {/* Customer */}
              <CustomerFields
                name={name}
                phone={phone}
                email={email}
                onName={(v) => {
                  setName(v)
                  if (nameInvalid && v.trim() !== "") setNameInvalid(false)
                }}
                onPhone={setPhone}
                onEmail={setEmail}
                nameInvalid={nameInvalid}
                nameRef={nameRef}
                suggestion={!isEdit ? lookupHit : null}
                onPickSuggestion={() => setLookupHit(null)}
                disabled={isLocked}
              />

              {/* Table */}
              <TableField
                value={tables[0] ?? ""}
                onChange={(v) => {
                  setTables(v ? [v] : [])
                  if (tableInvalid && v) setTableInvalid(false)
                }}
                invalid={tableInvalid}
                disabled={isLocked}
              />

              {/* Merge (only if primary is mergeable) */}
              {mergeable.length > 0 && (
                <MergeField
                  primaryTableId={primaryTableId}
                  selected={tables}
                  onChange={setTables}
                  siblings={mergeable}
                  disabled={isLocked}
                />
              )}

              {/* Occasion */}
              <OccasionSegmented
                value={occasion}
                onChange={setOccasion}
                disabled={isLocked}
              />

              {/* Notes */}
              <NotesField value={notes} onChange={setNotes} disabled={isLocked} />
            </div>
          </div>

          {/* Footer */}
          <Footer
            isEdit={isEdit}
            isLocked={isLocked}
            saving={saving}
            onClose={safeClose}
            onSave={handleSave}
            onAskDelete={() => setConfirmDelete(true)}
          />

          {/* Hidden title for screen readers */}
          <DialogTitle className="sr-only">
            {isEdit ? "Edit reservation" : "New reservation"}
          </DialogTitle>

          {/* Delete confirmation overlay */}
          {confirmDelete && reservation && (
            <ConfirmDelete
              reservation={reservation}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                setConfirmDelete(false)
                handleCancelReservation()
              }}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

interface HeaderProps {
  isEdit: boolean
  tables: string[]
  onClose: () => void
}

function Header({ isEdit, tables, onClose }: HeaderProps) {
  const { getTable } = useFloorTables()
  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-hair bg-card px-[22px] pt-3 pb-[14px] sm:px-7 sm:pt-5 sm:pb-[18px]">
      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-normal leading-tight tracking-[0.02em] text-foreground sm:text-[20px]">
          {isEdit ? "Edit Reservation" : "New Reservation"}
        </div>
        <div className="mt-1 truncate text-[11px] tracking-[0.04em] text-brand-ink-soft sm:text-[11.5px] sm:tracking-[0.06em]">
          {tableSubtitle(tables, getTable)}
        </div>
      </div>
      <IconButton ariaLabel="Close" onClick={onClose}>
        <X className="size-[14px]" strokeWidth={1.4} />
      </IconButton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status strip (edit mode)
// ---------------------------------------------------------------------------

interface StatusStripProps {
  status: ReservationStatus
  saving?: boolean
  onSeat?: () => void
  onCheckout?: () => void
  onNoShow?: () => void
  onCancel?: () => void
  onRebook?: () => void
  onMarkSeatedFromTerminal?: () => void
  onReopen?: () => void
}

const STATUS_META: Record<
  ReservationStatus,
  { label: string; container: string; dot: string; primaryBg: string; ghostBorder: string }
> = {
  booked: {
    label: "Booked",
    container: "bg-brand-gold-soft border-brand-gold/30",
    dot: "bg-brand-gold",
    primaryBg: "bg-brand-gold text-white",
    ghostBorder: "border-hair-strong text-foreground",
  },
  seated: {
    label: "Seated",
    container: "bg-primary/10 border-primary/30",
    dot: "bg-primary",
    primaryBg: "bg-primary text-primary-foreground",
    ghostBorder: "border-hair-strong text-foreground",
  },
  completed: {
    label: "Completed",
    container: "bg-foreground/[0.06] border-foreground/15",
    dot: "bg-foreground/45",
    primaryBg: "bg-foreground/60 text-background",
    ghostBorder: "border-hair-strong text-foreground",
  },
  cancelled: {
    label: "Cancelled",
    container: "bg-foreground/[0.04] border-foreground/10",
    dot: "bg-foreground/30",
    primaryBg: "bg-foreground/60 text-background",
    ghostBorder: "border-hair-strong text-foreground",
  },
  noshow: {
    label: "No-show",
    container: "bg-foreground/[0.06] border-foreground/15",
    dot: "bg-foreground/40",
    primaryBg: "bg-foreground/60 text-background",
    ghostBorder: "border-hair-strong text-foreground",
  },
}

function StatusStrip({
  status,
  saving,
  onSeat,
  onCheckout,
  onNoShow,
  onCancel,
  onRebook,
  onMarkSeatedFromTerminal,
  onReopen,
}: StatusStripProps) {
  const meta = STATUS_META[status]
  const actions: Array<{ label: string; onClick: () => void; primary?: boolean }> = []
  if (onReopen) actions.push({ label: "Re-open", onClick: onReopen, primary: true })
  if (onRebook) actions.push({ label: "Re-book", onClick: onRebook, primary: true })
  if (onMarkSeatedFromTerminal)
    actions.push({ label: "Mark Seated", onClick: onMarkSeatedFromTerminal })
  if (onSeat) actions.push({ label: "Mark Seated", onClick: onSeat, primary: true })
  if (onCheckout) actions.push({ label: "Check Out", onClick: onCheckout, primary: true })
  if (onNoShow) actions.push({ label: "Mark No-show", onClick: onNoShow })
  if (onCancel) actions.push({ label: "Cancel", onClick: onCancel })

  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-center gap-3 rounded-[3px] border px-3.5 py-2.5",
        meta.container,
      )}
    >
      <div className="inline-flex items-center gap-2">
        <span className={cn("size-[7px] rounded-full", meta.dot)} />
        <span
          className={cn(
            "text-[10.5px] font-medium tracking-[0.22em] uppercase",
            status === "booked" && "text-brand-gold-deep",
            status === "seated" && "text-primary",
            (status === "completed" || status === "cancelled" || status === "noshow") &&
              "text-brand-ink-soft",
          )}
        >
          {meta.label}
        </span>
      </div>
      {actions.length === 0 && (
        <span className="text-[11px] tracking-[0.04em] text-brand-ink-soft">
          Read-only · no quick actions
        </span>
      )}
      {actions.length > 0 && (
        <div className="ml-auto flex flex-wrap gap-1.5">
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              disabled={saving}
              className={cn(
                "h-[30px] rounded-[3px] px-3 text-[10.5px] font-medium tracking-[0.18em] uppercase",
                "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
                "disabled:cursor-not-allowed disabled:opacity-50",
                i === 0 && a.primary
                  ? meta.primaryBg
                  : cn("bg-card border", meta.ghostBorder, "hover:bg-foreground/[0.04]"),
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Date / Time fields
// ---------------------------------------------------------------------------

interface DateFieldProps {
  /** ISO YYYY-MM-DD */
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

function isoToDate(iso: string): Date | undefined {
  const parts = parseDateISO(iso)
  if (!parts) return undefined
  return new Date(parts.year, parts.month0, parts.day)
}

function dateToISO(d: Date): string {
  return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate())
}

function DateField({ value, onChange, disabled }: DateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const selected = isoToDate(value)

  return (
    <div>
      <span className={LABEL}>Date</span>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "mt-[7px] flex h-10 w-full items-center gap-2.5 rounded-[3px] border border-hair-strong bg-card px-3",
              "text-left transition-colors",
              "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <CalendarIcon className="size-[14px] text-brand-ink-soft" strokeWidth={1.4} />
            <span className="text-[13px] font-light tracking-[0.02em] text-foreground">
              {formatDateLabel(value)}
            </span>
            <ChevronDown className="ml-auto size-3 text-brand-ink-soft" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-[60] rounded-[3px] border border-hair-strong bg-popover p-2 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            )}
          >
            <DayPicker
              mode="single"
              weekStartsOn={1}
              showOutsideDays
              selected={selected}
              onSelect={(d) => {
                if (!d) return
                onChange(dateToISO(d))
                setOpen(false)
              }}
              classNames={{
                today: "rdp-today text-primary font-medium",
                selected:
                  "rdp-selected bg-primary text-primary-foreground rounded-full",
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  )
}

interface TimeFieldProps {
  value: string
  onChange: (v: string) => void
  slots: string[]
  shift: string
  disabled?: boolean
}

function TimeField({ value, onChange, slots, shift, disabled }: TimeFieldProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <div>
      <span className={LABEL}>Start time</span>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "mt-[7px] flex h-10 w-full items-center gap-2.5 rounded-[3px] border border-hair-strong bg-card px-3",
              "transition-colors hover:border-foreground/30",
              "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <Clock className="size-[14px] text-brand-ink-soft" strokeWidth={1.4} />
            <span className="text-[13px] font-light tracking-[0.02em] text-foreground">
              {value}
            </span>
            <span className="ml-auto text-[10.5px] tracking-[0.04em] text-brand-ink-mute">
              15-min steps
            </span>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-[60] max-h-[260px] w-[var(--radix-popover-trigger-width)] overflow-y-auto touch-pan-y overscroll-contain",
              "rounded-[3px] border border-hair-strong bg-popover p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            )}
          >
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s)
                  setOpen(false)
                }}
                className={cn(
                  "flex h-8 w-full items-center rounded-[2px] px-2.5 text-[13px] font-light tracking-[0.02em]",
                  "transition-colors hover:bg-foreground/[0.04]",
                  s === value && "bg-foreground/[0.05] text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <div className="mt-1.5 text-[11px] tracking-[0.02em] text-brand-ink-soft">
        Falls in: <span className="font-medium text-primary">{shift}</span> shift
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PAX stepper
// ---------------------------------------------------------------------------

function PaxStepper({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <span className={LABEL}>PAX · Party size</span>
      <div className="mt-[7px] inline-flex items-center gap-1.5">
        <StepBtn
          ariaLabel="Decrease guests"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled || value <= 1}
        >
          <Minus className="size-3" strokeWidth={1.6} />
        </StepBtn>
        <div
          className={cn(
            "flex h-10 w-16 items-center justify-center rounded-[3px] border border-hair-strong bg-card",
            "text-[17px] font-normal tracking-[0.02em] tabular-nums text-foreground",
            disabled && "opacity-60",
          )}
        >
          {value}
        </div>
        <StepBtn
          ariaLabel="Increase guests"
          onClick={() => onChange(Math.min(20, value + 1))}
          disabled={disabled || value >= 20}
        >
          <Plus className="size-3" strokeWidth={1.6} />
        </StepBtn>
        <span className="ml-2 text-[11px] text-brand-ink-soft">guests</span>
      </div>
    </div>
  )
}

function StepBtn({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "flex size-9 h-10 items-center justify-center rounded-[3px] border border-hair-strong bg-card",
        "transition-colors hover:border-foreground/30",
        "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// VIP toggle
// ---------------------------------------------------------------------------

function VipToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div>
      <span className={LABEL}>VIP</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={cn(
          "mt-[7px] inline-flex h-10 items-center gap-2 rounded-[3px] border px-3.5",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
          value
            ? "border-brand-gold/40 bg-brand-gold-soft text-brand-gold-deep"
            : "border-hair-strong bg-card text-brand-ink-soft hover:border-foreground/30",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Star
          className="size-[14px]"
          strokeWidth={1.4}
          fill={value ? "currentColor" : "none"}
        />
        <span className="text-[12px] font-medium tracking-[0.14em] uppercase">
          {value ? "VIP guest" : "Mark as VIP"}
        </span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Customer fields (name / phone / email + suggestion popover)
// ---------------------------------------------------------------------------

interface CustomerFieldsProps {
  name: string
  phone: string
  email: string
  onName: (v: string) => void
  onPhone: (v: string) => void
  onEmail: (v: string) => void
  nameInvalid: boolean
  nameRef: React.RefObject<HTMLInputElement | null>
  suggestion: { name: string; visits: number; vip: boolean } | null
  onPickSuggestion: () => void
  disabled?: boolean
}

function CustomerFields({
  name,
  phone,
  email,
  onName,
  onPhone,
  onEmail,
  nameInvalid,
  nameRef,
  suggestion,
  onPickSuggestion,
  disabled,
}: CustomerFieldsProps) {
  return (
    <div>
      <span className={LABEL}>Customer</span>
      <div className="mt-[7px] grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="relative">
          <IconInput
            icon={<User className="size-[13px]" strokeWidth={1.4} />}
            value={name}
            onChange={onName}
            placeholder="Full name"
            invalid={nameInvalid}
            inputRef={nameRef}
            disabled={disabled}
          />
        </div>
        <IconInput
          icon={<Phone className="size-[13px]" strokeWidth={1.4} />}
          value={phone}
          onChange={onPhone}
          placeholder="+961 …"
          type="tel"
          disabled={disabled}
        />
      </div>
      <div className="mt-2.5">
        <IconInput
          icon={<Mail className="size-[13px]" strokeWidth={1.4} />}
          value={email}
          onChange={onEmail}
          placeholder="Email (optional)"
          type="email"
          disabled={disabled}
        />
      </div>
      {suggestion && (
        <button
          type="button"
          onClick={onPickSuggestion}
          className={cn(
            "mt-2 flex w-full items-center gap-2.5 rounded-[3px] border border-hair-strong",
            "bg-foreground/[0.03] px-3 py-2 text-left transition-colors hover:bg-foreground/[0.05]",
          )}
        >
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground text-[11px] tracking-[0.08em] text-background">
            {initials(suggestion.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13px] font-normal text-foreground">
              {suggestion.name}
              {suggestion.vip && (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-[0.18em] uppercase text-brand-gold-deep">
                  <Star
                    className="size-2.5"
                    fill="currentColor"
                    strokeWidth={1.4}
                  />
                  VIP
                </span>
              )}
            </span>
            <span className="block text-[11px] text-brand-ink-soft">
              Auto-filled · {suggestion.visits} visits
            </span>
          </span>
          <Check
            className="size-3.5 text-brand-ink-soft"
            strokeWidth={1.6}
          />
        </button>
      )}
    </div>
  )
}

function IconInput({
  icon,
  value,
  onChange,
  placeholder,
  invalid,
  type = "text",
  inputRef,
  disabled,
}: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  invalid?: boolean
  type?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex h-10 items-center rounded-[3px] border bg-card",
        "focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-foreground/[0.06]",
        invalid ? "border-destructive" : "border-hair-strong",
        "transition-colors",
      )}
    >
      <span className="pl-3 text-brand-ink-mute">{icon}</span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-full flex-1 bg-transparent px-2.5 text-[13px] font-light tracking-[0.02em] text-foreground outline-none",
          "placeholder:text-brand-ink-mute",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table field
// ---------------------------------------------------------------------------

function TableField({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const { getTable, bySection } = useFloorTables()
  const def = value ? getTable(value) : null
  const display = def
    ? `${def.section[0].toUpperCase()}${def.section.slice(1)} · ${
        def.section === "bar" ? `Seat ${def.id}` : `Table ${def.id}`
      } (${def.section === "bar" ? "1 seat" : `seats ${def.capacity}`})`
    : ""

  const grouped = React.useMemo(() => {
    return {
      bar: bySection("bar", { activeOnly: true }),
      indoor: bySection("indoor", { activeOnly: true }),
      terrace: bySection("terrace", { activeOnly: true }),
    }
  }, [bySection])

  return (
    <div>
      <span className={LABEL}>Table</span>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "mt-[7px] flex h-10 w-full items-center gap-2.5 rounded-[3px] border px-3 transition-colors",
              "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
              invalid ? "border-destructive" : "border-hair-strong",
              "bg-card hover:border-foreground/30",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span
              className={cn(
                "flex-1 text-left text-[13px] font-light tracking-[0.02em]",
                display ? "text-foreground" : "text-brand-ink-mute",
              )}
            >
              {display || "Select a table…"}
            </span>
            <ChevronDown
              className="size-3.5 text-brand-ink-mute"
              strokeWidth={1.4}
            />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-[60] max-h-[300px] w-[var(--radix-popover-trigger-width)] overflow-y-auto touch-pan-y overscroll-contain",
              "rounded-[3px] border border-hair-strong bg-popover p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            )}
          >
            <TableGroup label="Bar" tables={grouped.bar} value={value} onPick={(v) => { onChange(v); setOpen(false) }} bar />
            <TableGroup label="Indoor" tables={grouped.indoor} value={value} onPick={(v) => { onChange(v); setOpen(false) }} />
            <TableGroup label="Terrace" tables={grouped.terrace} value={value} onPick={(v) => { onChange(v); setOpen(false) }} />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {invalid && (
        <div className="mt-1.5 text-[11px] text-destructive">Pick a table to continue.</div>
      )}
    </div>
  )
}

function TableGroup({
  label,
  tables,
  value,
  onPick,
  bar,
}: {
  label: string
  tables: { id: string; capacity: number }[]
  value: string
  onPick: (id: string) => void
  bar?: boolean
}) {
  return (
    <div className="py-1 first:pt-0 last:pb-0">
      <div className="px-2 py-1.5 text-[9.5px] font-medium tracking-[0.22em] uppercase text-brand-ink-mute">
        {label}
      </div>
      {bar ? (
        <div className="grid grid-cols-7 gap-1 px-1">
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              className={cn(
                "flex h-8 items-center justify-center rounded-[2px] text-[12px] font-light",
                "transition-colors hover:bg-foreground/[0.04]",
                t.id === value && "bg-foreground/[0.06] font-medium",
              )}
            >
              {t.id}
            </button>
          ))}
        </div>
      ) : (
        tables.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t.id)}
            className={cn(
              "flex h-8 w-full items-center rounded-[2px] px-2.5 text-[13px] font-light tracking-[0.02em]",
              "transition-colors hover:bg-foreground/[0.04]",
              t.id === value && "bg-foreground/[0.05] font-medium",
            )}
          >
            <span className="flex-1 text-left">Table {t.id}</span>
            <span className="text-[11px] text-brand-ink-mute">seats {t.capacity}</span>
          </button>
        ))
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Occasion segmented
// ---------------------------------------------------------------------------

function OccasionSegmented({
  value,
  onChange,
  disabled,
}: {
  value: ReservationOccasion | ""
  onChange: (v: ReservationOccasion | "") => void
  disabled?: boolean
}) {
  return (
    <div>
      <span className={LABEL}>Occasion</span>
      <div className="mt-[7px] -mx-1 overflow-x-auto px-1">
        <div
          className={cn(
            "inline-flex rounded-[3px] bg-foreground/[0.04] p-[3px]",
            disabled && "opacity-60",
          )}
        >
          {OCCASION_OPTIONS.map((opt) => {
            const active = value === opt.value
            return (
              <button
                key={opt.label}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.value)}
                className={cn(
                  "whitespace-nowrap rounded-[2px] px-3.5 py-1.5 text-[11px] tracking-[0.16em] uppercase transition-all duration-150",
                  active
                    ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "font-normal text-brand-ink-soft hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notes field
// ---------------------------------------------------------------------------

function NotesField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <span className={LABEL}>Notes</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Allergies, special requests, etc."
        rows={3}
        disabled={disabled}
        className={cn(
          "mt-[7px] w-full resize-y rounded-[3px] border border-hair-strong bg-card px-3 py-2.5",
          "text-[13px] font-light tracking-[0.02em] text-foreground placeholder:text-brand-ink-mute",
          "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/[0.06]",
          "transition-colors",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({
  isEdit,
  isLocked,
  saving,
  onClose,
  onSave,
  onAskDelete,
}: {
  isEdit: boolean
  isLocked: boolean
  saving: boolean
  onClose: () => void
  onSave: () => void
  onAskDelete: () => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-hair bg-card px-[18px] py-3 sm:px-6 sm:py-3.5">
      <div className="inline-flex gap-2">
        <button type="button" onClick={onClose} disabled={saving} className={cn(btnGhost, "disabled:cursor-not-allowed disabled:opacity-50")}>
          {isLocked ? "Close" : "Cancel"}
        </button>
        {isEdit && !isLocked && (
          <button
            type="button"
            onClick={onAskDelete}
            disabled={saving}
            className={cn(
              btnGhost,
              "hidden items-center gap-1.5 text-primary sm:inline-flex",
              "border-primary/30 hover:bg-primary/[0.06]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Trash2 className="size-[13px]" strokeWidth={1.4} />
            Delete reservation
          </button>
        )}
      </div>
      {!isLocked && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={cn(
            "h-9 rounded-[3px] bg-primary px-4 text-[11px] font-medium tracking-[0.22em] uppercase text-primary-foreground",
            "shadow-[0_6px_18px_-6px_oklch(0.572_0.165_28.5/0.50)]",
            "hover:bg-brand-red-dark transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "max-sm:flex-1",
          )}
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save reservation"}
        </button>
      )}
    </div>
  )
}

const btnGhost =
  "h-9 rounded-[3px] border border-hair-strong bg-card px-4 text-[11px] font-medium tracking-[0.22em] uppercase text-foreground transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10"

// ---------------------------------------------------------------------------
// Confirm delete sub-dialog
// ---------------------------------------------------------------------------

function ConfirmDelete({
  reservation,
  onCancel,
  onConfirm,
}: {
  reservation: Reservation
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/45 p-5">
      <div className="w-full max-w-[420px] rounded-[4px] bg-card p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.30)]">
        <div className="flex items-start gap-3">
          <div className="inline-flex size-[34px] items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trash2 className="size-4" strokeWidth={1.4} />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-normal tracking-[0.02em] text-foreground">
              Cancel this reservation?
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed font-light text-brand-ink-soft">
              <span className="font-normal text-foreground">
                {reservation.name} · {reservation.time} · {reservation.pax} guests
              </span>{" "}
              will be marked cancelled. The guest won't be notified.
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnGhost}>
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-9 rounded-[3px] bg-primary px-4 text-[11px] font-medium tracking-[0.22em] uppercase text-primary-foreground",
              "hover:bg-brand-red-dark transition-colors",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
            )}
          >
            Cancel reservation
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icon button
// ---------------------------------------------------------------------------

function IconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[3px] text-foreground",
        "transition-colors hover:bg-foreground/[0.05]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10",
      )}
    >
      {children}
    </button>
  )
}
