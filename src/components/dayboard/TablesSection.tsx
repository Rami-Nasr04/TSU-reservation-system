import { cn } from "@/lib/utils"
import type { TableDef } from "@/lib/tables"
import type { Reservation } from "@/services/reservationsService"
import { TableButton } from "./TableButton"

interface TablesSectionProps {
  title: string
  subtitle: string
  tables: TableDef[]
  reservations: Reservation[]
  isMobile?: boolean
}

export function TablesSection({
  title,
  subtitle,
  tables,
  reservations,
  isMobile,
}: TablesSectionProps) {
  return (
    <section>
      <header className="mb-3.5 flex items-baseline gap-3">
        <h2 className="text-[17px] font-normal tracking-[0.04em] text-foreground">
          {title}
        </h2>
        <span className="text-[11px] tracking-[0.06em] text-brand-ink-mute">
          {subtitle}
        </span>
      </header>
      <div
        className={cn(
          "grid gap-2.5",
          isMobile
            ? "grid-cols-[repeat(auto-fill,minmax(90px,1fr))]"
            : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]",
        )}
      >
        {tables.map((t) => (
          <div key={t.id} className="flex justify-center">
            <TableButton def={t} reservations={reservations} isMobile={isMobile} />
          </div>
        ))}
      </div>
    </section>
  )
}
