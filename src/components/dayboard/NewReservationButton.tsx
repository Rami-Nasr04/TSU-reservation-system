import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewReservationButtonProps {
  isMobile?: boolean
  onClick: () => void
}

export function NewReservationButton({ isMobile, onClick }: NewReservationButtonProps) {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="New reservation"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[3px]",
          "bg-primary text-primary-foreground transition-colors duration-150",
          "hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <Plus className="size-3.5" />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-[3px] px-3.5",
        "bg-primary text-primary-foreground transition-colors duration-150",
        "hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "text-[10.5px] font-medium uppercase tracking-[0.22em]",
      )}
    >
      <Plus className="size-3" />
      <span>New Reservation</span>
    </button>
  )
}
