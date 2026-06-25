import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { ServiceHeader } from "@/components/service/ServiceHeader"
import { ServiceKpiStrip } from "@/components/service/ServiceKpiStrip"
import { ServiceQueueList } from "@/components/service/ServiceQueueList"
import { FloorView } from "@/components/dayboard/FloorView"
import { WalkInDialog } from "@/components/reservations/WalkInDialog"
import { ReservationForm } from "@/components/reservations/ReservationForm"
import { CheckoutDialog } from "@/components/reservations/CheckoutDialog"

import { useDay } from "@/hooks/useDay"
import { useFloorTables } from "@/contexts/TablesContext"
import { formatDateISO, isPastDayLocked, isToday, parseDateISO, todayParts } from "@/lib/dates"
import { cn } from "@/lib/utils"
import {
  bucketShift,
  createReservation,
  updateReservation,
} from "@/services/reservationsService"
import type {
  DayFeed,
  Reservation,
  ReservationInput,
} from "@/services/reservationsService"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModalState =
  | { kind: "none" }
  | { kind: "walkin"; tableId: string; turn: 1 | 2 | 3 | null }
  | { kind: "reservation"; tableId?: string; turn?: 1 | 2 | 3 | null; reservation?: Reservation }
  | { kind: "checkout"; reservation: Reservation }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeDate(param: string | undefined): string {
  if (param && parseDateISO(param)) return param
  const t = todayParts()
  return formatDateISO(t.year, t.month0, t.day)
}

function useMergedFeed(
  data: DayFeed | null,
  localReservations: Reservation[],
): DayFeed | null {
  return React.useMemo(() => {
    if (!data) return null
    if (localReservations.length === 0) return data
    const localById = new Map(localReservations.map((r) => [r.id, r]))
    const serverIds = new Set(data.reservations.map((r) => r.id))
    const serverUpdated = data.reservations.map((r) => localById.get(r.id) ?? r)
    const newLocal = localReservations.filter((r) => !serverIds.has(r.id))
    const reservations = [...serverUpdated, ...newLocal]
    const byShift: Record<string, number> = { lunch: 0, afternoon: 0, late: 0 }
    for (const r of reservations) byShift[r.shift] = (byShift[r.shift] ?? 0) + 1
    return {
      ...data,
      reservations,
      shifts: data.shifts.map((s) =>
        s.id === "all"
          ? { ...s, count: reservations.length }
          : { ...s, count: byShift[s.id] ?? 0 },
      ),
      counters: {
        reservations: reservations.length,
        guests: reservations.reduce((s, r) => s + r.pax, 0),
        walkIns: reservations.filter((r) => r.isWalkIn).length,
        seated: reservations.filter((r) => r.status === "seated").length,
      },
    }
  }, [data, localReservations])
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServiceMode() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const date = safeDate(dateParam)
  const { data, isLoading } = useDay(date)
  const { tables } = useFloorTables()
  const totalTables = tables.filter((t) => t.active).length

  const [modal, setModal] = React.useState<ModalState>({ kind: "none" })
  const [modalRevision, setModalRevision] = React.useState(0)
  const [localReservations, setLocalReservations] = React.useState<Reservation[]>([])

  const feed = useMergedFeed(data, localReservations)

  // Service Mode is the live "now" board — derive the active shift from the wall
  // clock so the Indoor turn grid surfaces during late dinner (and lunch/afternoon
  // indoor bookings stay on the normal floor view).
  const now = new Date()
  const liveShift = bucketShift(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  )

  function openModal(next: Exclude<ModalState, { kind: "none" }>) {
    setModalRevision((r) => r + 1)
    setModal(next)
  }

  function closeModal() {
    setModal({ kind: "none" })
  }

  function handleTableClick(tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) {
    const isLive = resv && (resv.status === "booked" || resv.status === "seated")
    if (isLive) {
      openModal({ kind: "reservation", tableId, reservation: resv })
      return
    }
    // Free table — gate walk-ins to today, allow new reservation on future days.
    if (isPastDayLocked(date, feed)) {
      toast.info("Past day — view only.")
      return
    }
    if (isToday(date)) {
      openModal({ kind: "walkin", tableId, turn })
      return
    }
    openModal({ kind: "reservation", tableId, turn })
  }

  function handleReservationClick(resv: Reservation) {
    openModal({ kind: "reservation", reservation: resv })
  }

  function isNewId(id: string): boolean {
    return id.startsWith("res-") || id.startsWith("walkin-")
  }

  async function handleSave(r: Reservation, input: ReservationInput) {
    try {
      const saved = isNewId(r.id)
        ? await createReservation(input)
        : await updateReservation(r.id, input)
      setLocalReservations((prev) => {
        const idx = prev.findIndex((x) => x.id === r.id || x.id === saved.id)
        if (idx >= 0) return prev.map((x, i) => (i === idx ? saved : x))
        return [...prev, saved]
      })
      // Service Mode is day-scoped — if the form moved the reservation to a
      // different day, hop the dayboard there and exit service view (the new
      // day may not be the active shift). Clear localReservations first so the
      // moved row doesn't ghost-render back here if the host returns.
      if (input.date !== date) {
        setLocalReservations([])
        toast.success(`Reservation moved to ${input.date}`)
        navigate(`/day/${input.date}`)
      } else {
        toast.success("Reservation saved")
      }
      closeModal()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't save. Please try again.",
      )
      throw err
    }
  }

  function handleCheckout() {
    if (modal.kind !== "reservation" || !modal.reservation) return
    const reservation = modal.reservation
    setModalRevision((r) => r + 1)
    setModal({ kind: "checkout", reservation })
  }

  return (
    <div data-theme="service" className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Header — always visible */}
      <ServiceHeader date={date} feed={feed} />

      {/* Loading state */}
      {isLoading || !feed ? (
        <div className="py-12 text-center text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
          Loading…
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <ServiceKpiStrip feed={feed} totalTables={totalTables} />

          {/* Main content: floor + queue */}
          <main
            className={cn(
              "min-h-0 flex-1",
              // Mobile/tablet: vertical stack, page scrolls
              "flex flex-col",
              // Desktop: two-column split that fills remaining viewport (flex-1 on
              // a lg:h-dvh + lg:overflow-hidden parent — no hardcoded header/kpi math).
              "lg:grid lg:grid-cols-[1fr_380px] lg:overflow-hidden",
            )}
          >
            {/* Left / top — Floor view */}
            <section
              className={cn(
                "border-hair",
                // Desktop: fills column, internal scroll
                "lg:border-r lg:p-5 lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-col",
                // Mobile: sensible minimum height so the floor is usable
                "min-h-[60vh] p-4 flex flex-col",
              )}
            >
              <FloorView
                reservations={feed.reservations}
                activeShift={liveShift}
                onTableClick={handleTableClick}
              />
            </section>

            {/* Right / bottom — Queue list */}
            <section
              className={cn(
                "bg-card border-hair",
                // Desktop: fills column, internal scroll
                "lg:min-h-0 lg:overflow-hidden",
                // Mobile: minimum height + top border separator
                "min-h-[55vh] border-t lg:border-t-0",
              )}
            >
              <ServiceQueueList
                feed={feed}
                onReservationClick={handleReservationClick}
              />
            </section>
          </main>
        </>
      )}

      {/* Modals */}
      {modal.kind === "walkin" && (
        <WalkInDialog
          key={modalRevision}
          open
          onClose={closeModal}
          date={date}
          tableId={modal.tableId}
          turn={modal.turn}
          feed={feed}
          onSave={handleSave}
        />
      )}
      {modal.kind === "reservation" && (
        <ReservationForm
          key={modalRevision}
          open
          onClose={closeModal}
          date={date}
          feed={feed}
          initialTableId={modal.tableId}
          initialTurn={modal.turn}
          reservation={modal.reservation}
          onSave={handleSave}
          onCheckout={handleCheckout}
        />
      )}
      {modal.kind === "checkout" && (
        <CheckoutDialog
          key={modalRevision}
          open
          onClose={closeModal}
          date={date}
          feed={feed}
          reservation={modal.reservation}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
