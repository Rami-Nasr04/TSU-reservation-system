import { cn } from "@/lib/utils"

export type WordmarkSize = "sm" | "md" | "lg" | "xl"

interface TsunamiWordmarkProps {
  size?: WordmarkSize
  withDot?: boolean
  className?: string
}

const sizeText: Record<WordmarkSize, string> = {
  sm: "text-[14px]",
  md: "text-[18px]",
  lg: "text-[22px]",
  xl: "text-[28px]",
}

const sizeDot: Record<WordmarkSize, string> = {
  sm: "size-[6px] -top-[3px]",
  md: "size-[7.5px] -top-[4px]",
  lg: "size-[9.5px] -top-[5px]",
  xl: "size-[12px] -top-[6.5px]",
}

export function TsunamiWordmark({
  size = "lg",
  withDot = true,
  className,
}: TsunamiWordmarkProps) {
  return (
    <span
      className={cn(
        "relative inline-block leading-none text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "block font-light tracking-[0.42em] pr-[0.42em]",
          sizeText[size],
        )}
      >
        TSUNAMI
      </span>
      {withDot && (
        <span
          aria-hidden
          className={cn(
            "absolute left-[calc(64%+0.05em)] rounded-full",
            "bg-[radial-gradient(circle_at_38%_38%,var(--brand-red-soft)_0%,var(--brand-red)_55%,var(--brand-red-dark)_100%)]",
            sizeDot[size],
          )}
        />
      )}
    </span>
  )
}
