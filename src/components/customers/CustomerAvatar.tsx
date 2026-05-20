import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { initialsOf } from "./format"

interface CustomerAvatarProps {
  name: string | null
  vip?: boolean
  size?: number
  className?: string
}

export function CustomerAvatar({
  name,
  vip,
  size = 32,
  className,
}: CustomerAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-foreground font-medium tracking-[0.06em] text-background",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size / 3) }}
    >
      {initialsOf(name)}
      {vip && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full border-2 border-background bg-brand-gold"
          style={{ width: 12, height: 12 }}
        >
          <Star className="size-1.5 fill-white text-white" />
        </span>
      )}
    </span>
  )
}
