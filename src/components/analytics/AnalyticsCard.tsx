import * as React from "react"
import { cn } from "@/lib/utils"

interface AnalyticsCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  /** Drop the body padding — for full-bleed tables/lists with their own rows. */
  noPad?: boolean
  className?: string
  children: React.ReactNode
}

/** Shared section-card shell for the analytics dashboard (header + body). */
export function AnalyticsCard({
  title,
  subtitle,
  action,
  noPad,
  className,
  children,
}: AnalyticsCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[3px] border border-hair bg-card",
        className,
      )}
    >
      <header className="flex items-end justify-between gap-3 border-b border-hair px-5 pb-3.5 pt-4">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.26em] text-brand-ink-soft">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 truncate text-[12px] font-light tracking-[0.01em] text-brand-ink-mute">
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </header>
      <div className={cn("min-h-0 flex-1", !noPad && "p-5")}>{children}</div>
    </section>
  )
}
