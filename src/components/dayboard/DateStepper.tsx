import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateStepperProps {
  label: string
  onPrev: () => void
  onNext: () => void
  isMobile?: boolean
}

export function DateStepper({ label, onPrev, onNext, isMobile }: DateStepperProps) {
  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2">
      <StepperButton aria-label="Previous day" onClick={onPrev}>
        <ChevronLeft className="size-3.5" />
      </StepperButton>
      <div
        className={cn(
          "text-center font-normal tracking-[0.04em] text-foreground",
          "min-w-[100px] sm:min-w-[128px]",
          isMobile ? "text-[14px]" : "text-[16px]",
        )}
      >
        {label}
      </div>
      <StepperButton aria-label="Next day" onClick={onNext}>
        <ChevronRight className="size-3.5" />
      </StepperButton>
    </div>
  )
}

type StepperButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

function StepperButton({ className, children, ...rest }: StepperButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-7 sm:size-8 items-center justify-center rounded-[3px] text-foreground",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
