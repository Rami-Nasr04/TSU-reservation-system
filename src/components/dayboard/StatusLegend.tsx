import { cn } from "@/lib/utils"

const ITEMS = [
  { label: "Free",      cls: "border border-dashed border-hair-strong" },
  { label: "Booked",    cls: "border border-amber-700 dark:border-amber-300" },
  { label: "Seated",    cls: "border-[1.5px] border-primary bg-primary/10" },
  { label: "Completed", cls: "border border-hair bg-foreground/5" },
]

export function StatusLegend() {
  return (
    <div className="inline-flex items-center gap-3">
      {ITEMS.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-3 rounded-[2px]", it.cls)} />
          <span className="text-[10.5px] tracking-[0.06em] text-brand-ink-soft">
            {it.label}
          </span>
        </span>
      ))}
    </div>
  )
}
