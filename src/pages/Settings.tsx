import * as React from "react"
import { Navigate } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { TablesPanel } from "@/components/settings/TablesPanel"
import { StaffPanel } from "@/components/settings/StaffPanel"
import { useTables } from "@/hooks/useTables"
import { useUsers } from "@/hooks/useUsers"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

type Tab = "staff" | "tables"

export default function Settings() {
  const { hasRole } = useAuth()
  const [tab, setTab] = React.useState<Tab>("staff")

  const tables = useTables()
  const users = useUsers()

  // Settings is manager-only; supervisors/hosts bounce to the calendar.
  if (!hasRole("manager")) {
    return <Navigate to="/" replace />
  }

  const tableCount = tables.data?.length ?? 0
  const staffCount = users.data?.length ?? 0

  const headerCenter = (
    <span className="text-[15px] font-light tracking-[0.04em] text-foreground sm:text-[18px]">
      Settings
    </span>
  )

  return (
    <AppShell headerCenter={headerCenter} bare>
      <div className="mx-auto w-full max-w-[1080px] px-3.5 py-4 sm:px-6 sm:py-7">
        {/* Underline tabs */}
        <div className="mb-5 flex items-center gap-1 border-b border-hair">
          <TabButton
            label="Staff"
            count={staffCount}
            active={tab === "staff"}
            onClick={() => setTab("staff")}
          />
          <TabButton
            label="Tables"
            count={tableCount}
            active={tab === "tables"}
            onClick={() => setTab("tables")}
          />
        </div>

        {tab === "staff" ? (
          <StaffPanel
            users={users.data}
            isLoading={users.isLoading}
            error={users.error}
            refetch={users.refetch}
          />
        ) : (
          <TablesPanel
            tables={tables.data ?? []}
            isLoading={tables.isLoading}
            error={tables.error}
            refetch={tables.refetch}
          />
        )}
      </div>
    </AppShell>
  )
}

interface TabButtonProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function TabButton({ label, count, active, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative -mb-px flex items-center gap-2 px-3.5 py-2.5",
        "text-[12.5px] uppercase tracking-[0.16em] transition-colors duration-150",
        "border-b-2 focus-visible:outline-none",
        active
          ? "border-primary font-medium text-foreground"
          : "border-transparent font-normal text-brand-ink-soft hover:text-foreground",
      )}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5",
            "text-[10px] font-medium tabular-nums tracking-normal",
            active
              ? "bg-primary/[0.1] text-primary"
              : "bg-foreground/[0.06] text-brand-ink-soft",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
