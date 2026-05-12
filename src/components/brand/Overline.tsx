import * as React from "react"
import { cn } from "@/lib/utils"

export type OverlineSize = "xs" | "sm" | "md"
export type OverlineTone = "default" | "mute" | "ink"

interface OverlineProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: OverlineSize
  tone?: OverlineTone
  as?: "span" | "div"
}

const sizeText: Record<OverlineSize, string> = {
  xs: "text-[10.5px] tracking-[0.28em]",
  sm: "text-[11px] tracking-[0.22em]",
  md: "text-[12px] tracking-[0.22em]",
}

const toneText: Record<OverlineTone, string> = {
  default: "text-brand-ink-soft",
  mute: "text-brand-ink-mute",
  ink: "text-brand-ink",
}

export function Overline({
  size = "sm",
  tone = "default",
  as = "span",
  className,
  ...props
}: OverlineProps) {
  const Comp = as
  return (
    <Comp
      className={cn(
        "block uppercase font-normal leading-none",
        sizeText[size],
        toneText[tone],
        className,
      )}
      {...props}
    />
  )
}
