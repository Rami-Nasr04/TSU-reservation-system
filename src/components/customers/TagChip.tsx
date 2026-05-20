import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface TagChipProps {
  label: string
  /** When provided, renders an inline remove (×) affordance. */
  onRemove?: () => void
  className?: string
}

export function TagChip({ label, onRemove, className }: TagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "border border-hair bg-foreground/[0.04] text-[10.5px] tracking-[0.04em] text-brand-ink-soft",
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className={cn(
            "-mr-0.5 inline-flex size-3.5 items-center justify-center rounded-full",
            "text-brand-ink-mute transition-colors duration-150 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  )
}
