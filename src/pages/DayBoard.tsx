import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

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
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useDay } from "@/hooks/useDay"
import {
  dayLabel,
  formatDateISO,
  monthLinkLabel,
  parseDateISO,
  shiftDateISO,
  todayParts,
} from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { DayFeed } from "@/services/reservationsService"

type Variant = "mobile" | "tablet" | "desktop"

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

export default function DayBoard() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const variant = useVariant()
  const isMobile = variant === "mobile"
  const isTablet = variant === "tablet"

  const date = safeDate(dateParam)
  const parts = parseDateISO(date)!
  const { data, isLoading } = useDay(date)
  const [activeShift, setActiveShift] = React.useState<ActiveShift>("all")
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  function goDay(delta: number) {
    navigate(`/day/${shiftDateISO(date, delta)}`)
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
      <NewReservationButton isMobile={isMobile} />
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
          data?.shifts ?? [
            { id: "lunch", label: "Lunch", hours: "12–2pm", count: 0 },
            { id: "afternoon", label: "Afternoon", hours: "2–9pm", count: 0 },
            { id: "late", label: "Late Dinner", hours: "9–11:30pm", count: 0 },
            { id: "all", label: "All", hours: null, count: 0 },
          ]
        }
        isMobile={isMobile}
      />

      {isLoading || !data ? (
        <div className="py-12 text-center text-[11px] tracking-[0.22em] uppercase text-brand-ink-mute">
          Loading…
        </div>
      ) : isMobile ? (
        <MobileBody
          feed={data}
          activeShift={activeShift}
          drawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
          onCloseDrawer={() => setDrawerOpen(false)}
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
            <ListPanel feed={data} activeShift={activeShift} />
          </div>
          <div className="min-h-0 rounded-[3px] border border-hair bg-card p-4 lg:p-5">
            <FloorView reservations={data.reservations} />
          </div>
        </main>
      )}
    </AppShell>
  )
}

interface MobileBodyProps {
  feed: DayFeed
  activeShift: ActiveShift
  drawerOpen: boolean
  onOpenDrawer: () => void
  onCloseDrawer: () => void
}

function MobileBody({
  feed,
  activeShift,
  drawerOpen,
  onOpenDrawer,
  onCloseDrawer,
}: MobileBodyProps) {
  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      <main className="m-3 flex-1 min-h-0 overflow-auto rounded-[3px] border border-hair bg-card p-3 pb-20">
        <FloorView reservations={feed.reservations} isMobile />
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
          <ListPanel feed={feed} activeShift={activeShift} embedded />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
