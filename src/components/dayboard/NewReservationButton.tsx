import { Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NewReservationButtonProps {
  isMobile?: boolean
}

function noop() {
  toast.info("New Reservation form opens in the next slice.")
}

export function NewReservationButton({ isMobile }: NewReservationButtonProps) {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={noop}
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
      onClick={noop}
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
