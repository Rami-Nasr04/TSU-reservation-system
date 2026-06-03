import * as React from "react"
import { cn } from "@/lib/utils"
import { KanjiOrnament, TsunamiWordmark, Overline } from "@/components/brand"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-background bg-pinstripe",
        "flex items-center justify-center p-6 sm:p-10",
        "text-foreground font-sans",
      )}
    >
      <div className="flex w-full max-w-[420px] flex-col items-center sm:max-w-[440px]">
        <div
          className={cn(
            "w-full bg-card rounded-md border border-hair",
            "px-7 pt-9 pb-8 sm:px-11 sm:pt-11 sm:pb-9",
            "shadow-[0_1px_2px_oklch(0.186_0.013_270/0.04),0_12px_40px_-12px_oklch(0.186_0.013_270/0.10)]",
            "dark:shadow-[0_1px_2px_oklch(0_0_0/0.4),0_12px_40px_-12px_oklch(0_0_0/0.6)]",
            className,
          )}
        >
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <KanjiOrnament char="津" size="md" />
            <TsunamiWordmark size="md" />
            <KanjiOrnament char="波" size="md" />
          </div>
          <div className="-mx-3 mb-6 h-px bg-hair" />
          {children}
        </div>
        <Overline
          as="div"
          size="xs"
          tone="mute"
          className="mt-7 text-center"
        >
          Sushi Tsunami · Achrafieh
        </Overline>
      </div>
    </div>
  )
}
