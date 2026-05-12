import * as React from "react"
import { cn } from "@/lib/utils"
import { TsunamiWordmark } from "@/components/brand"
import { AvatarMenu } from "./AvatarMenu"

interface HeaderProps {
  center?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function Header({ center, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 grid h-14 sm:h-16 grid-cols-[1fr_auto_1fr] items-center",
        "px-3.5 sm:px-7 border-b border-hair",
        "bg-background/90 backdrop-blur-md backdrop-saturate-[1.4]",
        "text-foreground",
        className,
      )}
    >
      <div className="flex items-center">
        <TsunamiWordmark size="sm" />
      </div>
      <div className="flex items-center justify-center">{center}</div>
      <div className="flex items-center justify-end gap-1 sm:gap-2.5">
        {actions}
        <AvatarMenu />
      </div>
    </header>
  )
}
