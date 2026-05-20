import { cn } from "@/lib/utils"

export interface FilterPillOption<T extends string> {
  id: T
  label: string
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}

/**
 * Segmented filter control (All / VIP / Regulars / …). Generic over the id
 * union so callers stay type-safe; reusable for any single-select list filter.
 */
export function FilterPills<T extends string>({
  options,
  active,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[3px] bg-foreground/[0.04] p-[3px]",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.id === active
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-[2px] px-2.5 py-1.5 text-[10.5px] uppercase tracking-[0.14em]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive
                ? "bg-card font-medium text-foreground shadow-sm"
                : "font-normal text-brand-ink-soft hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
