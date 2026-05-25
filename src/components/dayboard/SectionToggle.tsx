import { cn } from "@/lib/utils"
import type { TableSection } from "@/lib/tables"

export type FloorViewSection = TableSection | "all"

const ITEMS: { id: FloorViewSection; label: string }[] = [
  { id: "bar",     label: "Bar" },
  { id: "indoor",  label: "Indoor" },
  { id: "terrace", label: "Terrace" },
  { id: "all",     label: "All" },
]

interface SectionToggleProps {
  active: FloorViewSection
  onChange: (next: FloorViewSection) => void
  isMobile?: boolean
}

export function SectionToggle({ active, onChange, isMobile }: SectionToggleProps) {
  return (
    <div className="inline-flex gap-1.5 rounded-full bg-foreground/[0.04] p-1">
      {ITEMS.map((it) => {
        const isActive = it.id === active
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              "rounded-full font-medium uppercase tracking-[0.2em]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isMobile ? "px-3.5 py-1.5 text-[11px]" : "px-4 py-2 text-[11.5px]",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-brand-ink-soft hover:text-foreground",
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
