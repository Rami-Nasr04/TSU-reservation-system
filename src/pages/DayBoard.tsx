import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MonitorPlay } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { canWrite } from "@/lib/auth"
import { AppShell } from "@/components/layout/AppShell"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { BackLink } from "@/components/dayboard/BackLink"
import { DateStepper } from "@/components/dayboard/DateStepper"
import { NewReservationButton } from "@/components/dayboard/NewReservationButton"
import { ShiftTabs } from "@/components/dayboard/ShiftTabs"
import type { ActiveShift } from "@/components/dayboard/ShiftTabs"
import { ListPanel } from "@/components/dayboard/ListPanel"
import { FloorView } from "@/components/dayboard/FloorView"
import { MobileListTrigger } from "@/components/dayboard/MobileListTrigger"
import { WalkInDialog } from "@/components/reservations/WalkInDialog"
import { ReservationForm } from "@/components/reservations/ReservationForm"
import { CheckoutDialog } from "@/components/reservations/CheckoutDialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { toast } from "sonner"

import { EmptyDayState } from "@/components/states/EmptyDayState"
import { ErrorState } from "@/components/states/ErrorState"
import { useDay } from "@/hooks/useDay"
import {
  dayLabel,
  formatDateISO,
  isPastDayLocked,
  isToday,
  monthLinkLabel,
  parseDateISO,
  shiftDateISO,
  todayParts,
} from "@/lib/dates"
import { cn } from "@/lib/utils"
import {
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

type Variant = "mobile" | "tablet" | "desktop"

type ModalState =
  | { kind: "none" }
  | { kind: "walkin"; tableId: string; turn: 1 | 2 | 3 | null }
  | { kind: "reservation"; tableId?: string; turn?: 1 | 2 | 3 | null; reservation?: Reservation }
  | { kind: "checkout"; reservation: Reservation }

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useVariant(): Variant {
  const [w, setW] = React.useState<number>(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  )
  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  if (w < 640) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

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

export default function DayBoard() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const { hasRole, userGroups } = useAuth()
  const writeOk = canWrite(userGroups)
  const variant = useVariant()
  const isMobile = variant === "mobile"
  const isTablet = variant === "tablet"

  const date = safeDate(dateParam)
  const parts = parseDateISO(date)!
  const todayView = isToday(date)
  const [reloadNonce, setReloadNonce] = React.useState(0)
  const { data, isLoading, error } = useDay(date, reloadNonce)

  const [activeShift, setActiveShift] = React.useState<ActiveShift>("all")
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [modal, setModal] = React.useState<ModalState>({ kind: "none" })
  const [modalRevision, setModalRevision] = React.useState(0)
  const [localReservations, setLocalReservations] = React.useState<Reservation[]>([])

  const feed = useMergedFeed(data, localReservations)
  const isEmpty = !!feed && feed.reservations.length === 0
  const past = isPastDayLocked(date, feed)

  function goDay(delta: number) {
    navigate(`/day/${shiftDateISO(date, delta)}`)
  }

  function openModal(next: Exclude<ModalState, { kind: "none" }>) {
    setModalRevision((r) => r + 1)
    setModal(next)
  }

  function handleTableClick(tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) {
    const isLive = resv && (resv.status === "booked" || resv.status === "seated")
    if (isLive) {
      // Existing reservations stay editable on any day so staff can clean up
      // past services (seat/checkout/cancel/no-show).
      openModal({ kind: "reservation", tableId, reservation: resv })
      return
    }
    // Free table — gate by role first, then by date.
    if (!writeOk) {
      toast.info("View-only access")
      return
    }
    if (past) {
      toast.info("Past day — view only.")
      return
    }
    if (todayView) {
      openModal({ kind: "walkin", tableId, turn })
      return
    }
    // Future day → new reservation seeded with this table (and turn, if a grid cell).
    openModal({ kind: "reservation", tableId, turn })
  }

  function handleReservationClick(resv: Reservation) {
    openModal({ kind: "reservation", reservation: resv })
  }

  function handleNewReservation() {
    openModal({ kind: "reservation" })
  }

  // New reservations carry a temp id minted by the modals (res-… / walkin-…);
  // anything else is a persisted row being edited.
  function isNewId(id: string): boolean {
    return id.startsWith("res-") || id.startsWith("walkin-")
  }

  // Sync-await: the modal stays open during the call and closes only on success.
  // localReservations is updated from the SERVER row (real id, enriched fields),
  // so useMergedFeed reconciles cleanly on the next day refetch.
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
      // If the user changed the reservation's date in the form, hop the
      // DayBoard to the saved day so the row is visible without manual nav.
      // Clear localReservations first so the moved row doesn't ghost-render
      // back on the source day if the host navigates there next.
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
      throw err // let the modal re-enable its button
    }
  }

  function handleCheckout() {
    if (modal.kind !== "reservation" || !modal.reservation) return
    const reservation = modal.reservation
    setModalRevision((r) => r + 1)
    setModal({ kind: "checkout", reservation })
  }

  function closeModal() {
    setModal({ kind: "none" })
  }

  const headerLeft = <BackLink monthLabel={monthLinkLabel(parts.year, parts.month0)} />
  const headerCenter = (
    <DateStepper
      label={dayLabel(parts.year, parts.month0, parts.day)}
      onPrev={() => goDay(-1)}
      onNext={() => goDay(1)}
      isMobile={isMobile}
    />
  )
  const headerActions = (
    <>
      {hasRole("manager") && (
        isMobile ? (
          <button
            type="button"
            aria-label="Service Mode"
            onClick={() => navigate(`/day/${date}/service`)}
            className="inline-flex size-8 items-center justify-center rounded-[3px] border border-hair-strong text-brand-ink-soft"
          >
            <MonitorPlay size={14} strokeWidth={1.4} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/day/${date}/service`)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-[3px] border border-hair-strong px-3",
              "text-[10.5px] font-medium uppercase tracking-[0.22em] text-brand-ink-soft",
              "transition-colors hover:text-foreground hover:border-foreground/30",
            )}
          >
            <MonitorPlay size={12} strokeWidth={1.4} />
            Service
          </button>
        )
      )}
      {!past && writeOk && (
        <NewReservationButton isMobile={isMobile} onClick={handleNewReservation} />
      )}
      <ThemeToggle />
    </>
  )

  return (
    <AppShell
      headerLeft={headerLeft}
      headerCenter={headerCenter}
      headerActions={headerActions}
      bare
    >
      <ShiftTabs
        active={activeShift}
        onChange={setActiveShift}
        shifts={
          feed?.shifts ?? [
            { id: "lunch", label: "Lunch", hours: "12–2pm", count: 0 },
            { id: "afternoon", label: "Afternoon", hours: "2–7pm", count: 0 },
            { id: "late", label: "Late Dinner", hours: "7pm–12am", count: 0 },
            { id: "all", label: "All", hours: null, count: 0 },
          ]
        }
        isMobile={isMobile}
      />

      {error && !data ? (
        <div className="h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)]">
          <ErrorState
            onRetry={() => setReloadNonce((n) => n + 1)}
            onBackToCalendar={() => navigate("/")}
          />
        </div>
      ) : (
        <>
          {isLoading || !feed ? (
            <div className="py-12 text-center text-[11px] tracking-[0.22em] uppercase text-brand-ink-mute">
              Loading…
            </div>
          ) : isMobile ? (
            <MobileBody
              feed={feed}
              activeShift={activeShift}
              isEmpty={isEmpty}
              date={date}
              readOnly={!writeOk}
              drawerOpen={drawerOpen}
              onOpenDrawer={() => setDrawerOpen(true)}
              onCloseDrawer={() => setDrawerOpen(false)}
              onTableClick={handleTableClick}
              onReservationClick={handleReservationClick}
              onNewReservation={handleNewReservation}
            />
          ) : (
            <main
              className={cn(
                "grid min-h-0 flex-1 gap-5 overflow-hidden",
                "p-3.5 sm:p-5 lg:p-6",
                isTablet ? "grid-cols-[38%_62%]" : "grid-cols-[35%_65%]",
                "h-[calc(100dvh-56px-46px)] sm:h-[calc(100dvh-64px-52px)]",
              )}
            >
              <div className="min-h-0">
                {isEmpty ? (
                  <EmptyDayState
                    date={date}
                    feed={feed}
                    readOnly={!writeOk}
                    onNewReservation={handleNewReservation}
                  />
                ) : (
                  <ListPanel
                    feed={feed}
                    activeShift={activeShift}
                    onReservationClick={handleReservationClick}
                  />
                )}
              </div>
              <div className="min-h-0 rounded-[3px] border border-hair bg-card p-4 lg:p-5">
                <FloorView
                  reservations={feed.reservations}
                  onTableClick={handleTableClick}
                />
              </div>
            </main>
          )}
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
          readOnly={!writeOk}
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
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Mobile sub-layout
// ---------------------------------------------------------------------------

interface MobileBodyProps {
  feed: DayFeed
  activeShift: ActiveShift
  isEmpty: boolean
  date: string
  readOnly: boolean
  drawerOpen: boolean
  onOpenDrawer: () => void
  onCloseDrawer: () => void
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  onReservationClick: (r: Reservation) => void
  onNewReservation: () => void
}

function MobileBody({
  feed,
  activeShift,
  isEmpty,
  date,
  readOnly,
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  onTableClick,
  onReservationClick,
  onNewReservation,
}: MobileBodyProps) {
  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      <main className="m-3 flex-1 min-h-0 overflow-auto rounded-[3px] border border-hair bg-card p-3 pb-20">
        <FloorView
          reservations={feed.reservations}
          isMobile
          onTableClick={onTableClick}
        />
      </main>
      <MobileListTrigger
        count={feed.reservations.length}
        onClick={onOpenDrawer}
      />
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => (open ? onOpenDrawer() : onCloseDrawer())}
      >
        <DrawerContent className="h-[78dvh]">
          <DrawerTitle className="sr-only">Reservations</DrawerTitle>
          {isEmpty ? (
            <EmptyDayState
              date={date}
              feed={feed}
              readOnly={readOnly}
              onNewReservation={onNewReservation}
            />
          ) : (
            <ListPanel
              feed={feed}
              activeShift={activeShift}
              embedded
              onReservationClick={onReservationClick}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
