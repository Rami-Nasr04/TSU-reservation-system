import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface BackLinkProps {
  /** Label shown next to the chevron on tablet/desktop. Hidden on mobile. */
  monthLabel: string
}

export function BackLink({ monthLabel }: BackLinkProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Back to calendar"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[3px] text-foreground",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <ChevronLeft className="size-3.5 sm:size-4" />
      </button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className={cn(
          "hidden sm:inline-block truncate",
          "text-[11px] font-medium uppercase tracking-[0.22em] text-brand-ink-soft",
          "hover:text-foreground",
        )}
      >
        {monthLabel}
      </button>
    </div>
  )
}
