import { TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  onRetry: () => void
  onBackToCalendar?: () => void
}

export function ErrorState({ onRetry, onBackToCalendar }: ErrorStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div
        className={cn(
          "bg-card border border-hair rounded-[4px]",
          "w-[440px] max-w-full px-9 sm:px-11 pt-10 pb-8 text-center",
          "shadow-[0_12px_40px_-16px_rgba(20,25,35,0.18)]",
        )}
      >
        {/* Icon circle */}
        <div className="inline-flex items-center justify-center size-[52px] rounded-full bg-foreground/[0.04] text-brand-ink-soft mb-[18px]">
          <TriangleAlert size={22} strokeWidth={1.4} />
        </div>

        {/* Overline */}
        <p className="text-[10px] font-medium tracking-[0.30em] uppercase text-brand-ink-soft mb-2.5">
          Something went wrong
        </p>

        {/* Title */}
        <h2 className="text-[20px] font-normal tracking-[0.02em] text-foreground mb-2.5">
          We couldn&#8217;t load this view
        </h2>

        {/* Description */}
        <p className="text-[12.5px] font-light leading-[1.6] tracking-[0.02em] text-brand-ink-soft mb-6">
          Try again in a moment. If the problem persists, contact your manager.
        </p>

        {/* Button row */}
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "h-10 px-[18px] bg-primary text-primary-foreground rounded-[3px]",
              "text-[11px] font-medium tracking-[0.22em] uppercase",
              "hover:bg-brand-red-dark transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            Try again
          </button>
          {onBackToCalendar !== undefined && (
            <button
              type="button"
              onClick={onBackToCalendar}
              className={cn(
                "h-10 px-4 bg-transparent text-foreground border border-hair-strong rounded-[3px]",
                "text-[11px] font-medium tracking-[0.22em] uppercase",
                "hover:border-foreground/30 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              Back to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
