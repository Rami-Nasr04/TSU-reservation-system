import { Footprints } from "lucide-react"
import { cn } from "@/lib/utils"

interface WalkInButtonProps {
  isMobile?: boolean
  onClick: () => void
}

export function WalkInButton({ isMobile, onClick }: WalkInButtonProps) {
  if (isMobile) {
    return (
      <button
        type="button"
        aria-label="Add walk-in"
        onClick={onClick}
        className="inline-flex size-8 items-center justify-center rounded-[3px] border border-hair-strong text-brand-ink-soft"
      >
        <Footprints size={14} strokeWidth={1.4} />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-[3px] border border-hair-strong px-3",
        "text-[10.5px] font-medium uppercase tracking-[0.22em] text-brand-ink-soft",
        "transition-colors hover:text-foreground hover:border-foreground/30",
      )}
    >
      <Footprints size={12} strokeWidth={1.4} />
      Walk-in
    </button>
  )
}
