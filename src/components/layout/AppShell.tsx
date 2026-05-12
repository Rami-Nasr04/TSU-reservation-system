import * as React from "react"
import { cn } from "@/lib/utils"
import { Header } from "./Header"

interface AppShellProps {
  headerCenter?: React.ReactNode
  headerActions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AppShell({
  headerCenter,
  headerActions,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background bg-pinstripe text-foreground">
      <Header center={headerCenter} actions={headerActions} />
      <main
        className={cn(
          "px-3.5 sm:px-7 lg:px-10 py-4 sm:py-5 lg:py-6",
          "flex flex-col gap-3 sm:gap-5",
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}
