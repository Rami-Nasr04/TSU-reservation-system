import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineBannerProps {
  onRetry?: () => void
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div role="status" className="flex w-full items-center gap-3 bg-foreground text-background px-7 py-2.5">
      {/* Icon circle */}
      <div className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-background/10">
        <WifiOff size={14} strokeWidth={1.4} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] tracking-[0.02em]">
          You&#8217;re offline
        </p>
        <p className="text-[11px] tracking-[0.02em] text-background/65 mt-0.5">
          You can keep viewing. Changes won&#8217;t save until you&#8217;re back online.
        </p>
      </div>

      {/* Retry button — only when provided */}
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "h-[30px] px-3 rounded-[3px]",
            "bg-background/10 text-background border border-background/20",
            "text-[10.5px] font-medium tracking-[0.22em] uppercase",
            "hover:bg-background/20 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/40",
          )}
        >
          Retry
        </button>
      )}
    </div>
  )
}
