import * as React from "react"
import { cn } from "@/lib/utils"
import { Header } from "./Header"

interface AppShellProps {
  headerLeft?: React.ReactNode
  headerCenter?: React.ReactNode
  headerActions?: React.ReactNode
  /** When true, AppShell renders only the Header. The page body sits outside in custom layout. */
  bare?: boolean
  children: React.ReactNode
  className?: string
}

export function AppShell({
  headerLeft,
  headerCenter,
  headerActions,
  bare,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background bg-pinstripe text-foreground">
      <Header left={headerLeft} center={headerCenter} actions={headerActions} />
      {bare ? (
        children
      ) : (
        <main
          className={cn(
            "px-3.5 sm:px-7 lg:px-10 py-3 sm:py-4",
            "flex flex-col gap-3 sm:gap-3",
            className,
          )}
        >
          {children}
        </main>
      )}
    </div>
  )
}
