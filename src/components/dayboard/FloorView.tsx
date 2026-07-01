import * as React from "react"
import { useFloorTables } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { SectionToggle, type FloorViewSection } from "./SectionToggle"
import { StatusLegend } from "./StatusLegend"
import { BarSection } from "./BarSection"
import { TablesSection } from "./TablesSection"
import { TurnGrid } from "./TurnGrid"
import type { ActiveShift } from "./ShiftTabs"
import { usesTurns } from "@/lib/turns"

interface FloorViewProps {
  reservations: Reservation[]
  isMobile?: boolean
  /** Active shift tab — drives whether the Indoor slot shows the late-dinner turn grid. */
  activeShift: ActiveShift
  onTableClick: (tableId: string, turn: 1 | 2 | 3 | null, resv?: Reservation) => void
  canWalkIn: boolean
  onTableHold: (tableId: string, turn: 1 | 2 | 3 | null) => void
}

export function FloorView({ reservations, isMobile, activeShift, onTableClick, canWalkIn, onTableHold }: FloorViewProps) {
  const { bySection } = useFloorTables()
  const [section, setSection] = React.useState<FloorViewSection>("indoor")

  const bar = bySection("bar", { activeOnly: true })
  const indoor = bySection("indoor", { activeOnly: true })
  const terrace = bySection("terrace", { activeOnly: true })

  const showBar = section === "bar" || section === "all"
  const showIndoor = section === "indoor" || section === "all"
  const showTerrace = section === "terrace" || section === "all"

  // The Indoor slot becomes the turn grid only on the Late-dinner shift.
  const indoorUsesTurns = activeShift !== "all" && usesTurns("indoor", activeShift)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionToggle active={section} onChange={setSection} isMobile={isMobile} />
        {!isMobile && <StatusLegend />}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6">
          {showBar && (
            <BarSection
              tables={bar}
              reservations={reservations}
              onTableClick={onTableClick}
            />
          )}
          {showIndoor && (
            <div className={section === "all" && showBar ? "border-t border-hair pt-6" : undefined}>
              {indoorUsesTurns ? (
                <TurnGrid
                  tables={indoor}
                  reservations={reservations}
                  isMobile={isMobile}
                  canWalkIn={canWalkIn}
                  onTableClick={onTableClick}
                  onTableHold={onTableHold}
                />
              ) : (
                <TablesSection
                  title="Indoor"
                  subtitle={`${indoor.length} tables · main dining room`}
                  tables={indoor}
                  reservations={reservations}
                  isMobile={isMobile}
                  canWalkIn={canWalkIn}
                  onTableClick={onTableClick}
                  onTableHold={onTableHold}
                />
              )}
            </div>
          )}
          {showTerrace && (
            <div className={section === "all" ? "border-t border-hair pt-6" : undefined}>
              <TablesSection
                title="Terrace"
                subtitle={`${terrace.length} tables · outdoor`}
                tables={terrace}
                reservations={reservations}
                isMobile={isMobile}
                canWalkIn={canWalkIn}
                onTableClick={onTableClick}
                onTableHold={onTableHold}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
