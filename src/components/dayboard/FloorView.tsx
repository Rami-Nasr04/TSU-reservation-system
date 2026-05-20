import * as React from "react"
import { type TableSection } from "@/lib/tables"
import { useFloorTables } from "@/contexts/TablesContext"
import type { Reservation } from "@/services/reservationsService"
import { SectionToggle } from "./SectionToggle"
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
  const [section, setSection] = React.useState<TableSection>("indoor")

  const bar = bySection("bar", { activeOnly: true })
  const indoor = bySection("indoor", { activeOnly: true })
  const terrace = bySection("terrace", { activeOnly: true })

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionToggle active={section} onChange={setSection} isMobile={isMobile} />
        {!isMobile && <StatusLegend />}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {section === "bar" && (
          <BarSection
            tables={bar}
            reservations={reservations}
            onTableClick={onTableClick}
          />
        )}
        {section === "indoor" && (
          <TablesSection
            title="Indoor"
            subtitle={`${indoor.length} tables · main dining room`}
            tables={indoor}
            reservations={reservations}
            isMobile={isMobile}
            onTableClick={onTableClick}
          />
        )}
        {section === "terrace" && (
          <TablesSection
            title="Terrace"
            subtitle={`${terrace.length} tables · outdoor`}
            tables={terrace}
            reservations={reservations}
            isMobile={isMobile}
            onTableClick={onTableClick}
          />
        )}
      </div>
    </div>
  )
}
