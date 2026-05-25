import * as React from "react"
import { useFloorTables } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { SectionToggle, type FloorViewSection } from "./SectionToggle"
import { StatusLegend } from "./StatusLegend"
import { BarSection } from "./BarSection"
import { TablesSection } from "./TablesSection"

interface FloorViewProps {
  reservations: Reservation[]
  isMobile?: boolean
  onTableClick: (tableId: string, resv?: Reservation) => void
}

export function FloorView({ reservations, isMobile, onTableClick }: FloorViewProps) {
  const { bySection } = useFloorTables()
  const [section, setSection] = React.useState<FloorViewSection>("indoor")

  const bar = bySection("bar", { activeOnly: true })
  const indoor = bySection("indoor", { activeOnly: true })
  const terrace = bySection("terrace", { activeOnly: true })

  const showBar = section === "bar" || section === "all"
  const showIndoor = section === "indoor" || section === "all"
  const showTerrace = section === "terrace" || section === "all"

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
              <TablesSection
                title="Indoor"
                subtitle={`${indoor.length} tables · main dining room`}
                tables={indoor}
                reservations={reservations}
                isMobile={isMobile}
                onTableClick={onTableClick}
              />
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
                onTableClick={onTableClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
