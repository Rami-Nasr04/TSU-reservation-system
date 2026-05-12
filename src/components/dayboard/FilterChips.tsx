import { cn } from "@/lib/utils"
import type { ReservationStatus } from "@/services/reservationsService"

export type StatusFilter = "all" | ReservationStatus

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "booked",    label: "Booked" },
  { id: "seated",    label: "Seated" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "noshow",    label: "No-show" },
]

interface FilterChipsProps {
  active: StatusFilter
  onChange: (next: StatusFilter) => void
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {FILTERS.map((f) => {
        const isActive = active === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10.5px] tracking-[0.06em]",
              "border transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive
                ? "border-hair-strong bg-card font-medium text-foreground"
                : "border-hair bg-transparent font-normal text-brand-ink-soft hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
