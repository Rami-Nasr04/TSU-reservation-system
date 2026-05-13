import { List } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileListTriggerProps {
  count: number
  onClick: () => void
}

export function MobileListTrigger({ count, onClick }: MobileListTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-20",
        "inline-flex items-center gap-2 rounded-full bg-foreground px-[18px] py-2.5",
        "text-[11px] font-medium uppercase tracking-[0.22em] text-background",
        "shadow-[0_8px_24px_-8px_oklch(0.186_0.013_270/0.40)]",
        "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <List className="size-3.5" />
      <span>List ({count})</span>
    </button>
  )
}
