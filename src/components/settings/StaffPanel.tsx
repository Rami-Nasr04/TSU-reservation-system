import * as React from "react"
import { MoreVertical, Search } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterPills, type FilterPillOption } from "@/components/customers/FilterPills"
import { initialsOf } from "@/components/customers/format"
import { patchUser, type StaffUser } from "@/services/usersService"
import type { UserRole } from "@/contexts/AuthContext"
import { Toggle } from "./Toggle"
import { AddStaffModal } from "./AddStaffModal"
import { EditStaffModal } from "./EditStaffModal"
import { ResetPasswordDialog } from "./ResetPasswordDialog"

interface StaffPanelProps {
  users: StaffUser[] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

type RoleFilter = UserRole | "all"

const ROLE_PILLS: FilterPillOption<RoleFilter>[] = [
  { id: "all", label: "All" },
  { id: "manager", label: "Manager" },
  { id: "supervisor", label: "Supervisor" },
  { id: "host", label: "Host" },
  { id: "staff", label: "Staff" },
]

const ROLE_LABEL: Record<UserRole, string> = {
  manager: "Manager",
  supervisor: "Supervisor",
  host: "Host",
  staff: "Staff",
}

/** Shared row/card action handlers, threaded down from the panel. */
interface RowActions {
  onEdit: (user: StaffUser) => void
  onResetPassword: (user: StaffUser) => void
  onToggleActive: (user: StaffUser) => void
  busyToggleId: string | null
}

export function StaffPanel({ users, isLoading, error, refetch }: StaffPanelProps) {
  const [query, setQuery] = React.useState("")
  const [role, setRole] = React.useState<RoleFilter>("all")
  const [adding, setAdding] = React.useState(false)
  const [editing, setEditing] = React.useState<StaffUser | null>(null)
  const [resetting, setResetting] = React.useState<StaffUser | null>(null)
  const [busyToggleId, setBusyToggleId] = React.useState<string | null>(null)

  const source = React.useMemo<StaffUser[]>(() => users ?? [], [users])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return source.filter((s) => {
      if (role !== "all" && s.role !== role) return false
      if (!q) return true
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    })
  }, [source, role, query])

  const activeCount = source.filter((s) => s.active).length
  const inactiveCount = source.length - activeCount

  const handleToggleActive = React.useCallback(
    async (user: StaffUser) => {
      setBusyToggleId(user.id)
      try {
        await patchUser(user.id, { active: !user.active })
        toast.success(user.active ? "Account deactivated" : "Account reactivated")
        refetch()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't update the account.",
        )
      } finally {
        setBusyToggleId(null)
      }
    },
    [refetch],
  )

  const actions = React.useMemo<RowActions>(
    () => ({
      onEdit: setEditing,
      onResetPassword: setResetting,
      onToggleActive: handleToggleActive,
      busyToggleId,
    }),
    [handleToggleActive, busyToggleId],
  )

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-[11.5px] text-brand-ink-soft">{error}</span>
        <button
          type="button"
          onClick={refetch}
          className="rounded-full border border-hair-strong px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft hover:text-foreground"
        >
          Try again
        </button>
      </div>
    )
  }
  if (isLoading && !users) {
    return (
      <div className="py-16 text-center text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
        Loading staff…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-medium tracking-[0.04em] text-foreground">
            Staff
          </h2>
          <span className="text-[11.5px] tracking-[0.02em] text-brand-ink-soft">
            {activeCount} active · {inactiveCount} inactive
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn(
            "hidden h-9 items-center gap-1.5 rounded-[3px] bg-primary px-3.5 sm:inline-flex",
            "text-[11px] font-medium uppercase tracking-[0.16em] text-primary-foreground",
            "transition-colors duration-150 hover:bg-brand-red-dark",
          )}
        >
          + Add staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-ink-mute" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-9 bg-card pl-9"
          />
        </div>
        <FilterPills options={ROLE_PILLS} active={role} onChange={setRole} />
      </div>

      {source.length === 0 ? (
        <div className="rounded-[3px] border border-hair bg-background py-14 text-center text-[12px] text-brand-ink-soft">
          No staff yet. Add a manager, supervisor, host, or staff member to get started.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[3px] border border-hair bg-background py-14 text-center text-[11.5px] text-brand-ink-soft">
          No staff match your search.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[3px] border border-hair bg-background sm:block">
            <div className="grid grid-cols-[2.2fr_1fr_1fr_0.5fr_0.3fr] items-center bg-foreground/[0.025] px-[18px] py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink-mute">
              <span>Member</span>
              <span>Role</span>
              <span>Last active</span>
              <span className="text-right">Active</span>
              <span />
            </div>
            {filtered.map((s) => (
              <StaffRow key={s.id} user={s} actions={actions} />
            ))}
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filtered.map((s) => (
              <StaffCard key={s.id} user={s} actions={actions} />
            ))}
          </div>
        </>
      )}

      {/* Mobile add button */}
      <button
        type="button"
        onClick={() => setAdding(true)}
        className={cn(
          "flex h-10 items-center justify-center gap-1.5 rounded-[3px] bg-primary sm:hidden",
          "text-[11px] font-medium uppercase tracking-[0.16em] text-primary-foreground",
          "transition-colors duration-150 hover:bg-brand-red-dark",
        )}
      >
        + Add staff
      </button>

      {adding && (
        <AddStaffModal
          open
          onClose={() => setAdding(false)}
          onCreated={refetch}
        />
      )}
      {editing && (
        <EditStaffModal
          user={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}
      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          open
          onClose={() => setResetting(null)}
        />
      )}
    </div>
  )
}

function RoleChip({ role }: { role: UserRole }) {
  const tone =
    role === "manager"
      ? "bg-primary/[0.08] text-primary"
      : role === "supervisor"
        ? "bg-brand-gold-soft text-brand-gold-deep"
        : "bg-foreground/[0.05] text-brand-ink-soft"
  const dot =
    role === "manager"
      ? "bg-primary"
      : role === "supervisor"
        ? "bg-brand-gold"
        : "bg-brand-ink-soft"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[10px] font-medium uppercase tracking-[0.18em]",
        tone,
      )}
    >
      <span className={cn("size-[5px] rounded-full", dot)} />
      {ROLE_LABEL[role]}
    </span>
  )
}

function RowMenu({ user, actions }: { user: StaffUser; actions: RowActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-7 items-center justify-center rounded-[3px] text-brand-ink-soft outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`${user.name ?? user.email} menu`}
      >
        <MoreVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => actions.onEdit(user)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onResetPassword(user)}>
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onToggleActive(user)}
          className="text-destructive focus:text-destructive"
        >
          {user.active ? "Deactivate" : "Reactivate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Avatar({ name }: { name: string | null }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium tracking-[0.08em] text-background">
      {initialsOf(name)}
    </span>
  )
}

function StaffRow({ user, actions }: { user: StaffUser; actions: RowActions }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.2fr_1fr_1fr_0.5fr_0.3fr] items-center border-t border-hair px-[18px] py-3",
        !user.active && "opacity-55",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] tracking-[0.02em] text-foreground">
            {user.name ?? "—"}
          </div>
          <div className="truncate text-[11.5px] tracking-[0.01em] text-brand-ink-soft">
            {user.email}
          </div>
        </div>
      </div>
      <div>
        <RoleChip role={user.role} />
      </div>
      <span className="text-[12px] tracking-[0.02em] text-brand-ink-soft">
        {user.lastActiveAt ?? "—"}
      </span>
      <div className="flex justify-end">
        <Toggle
          on={user.active}
          onChange={() => actions.onToggleActive(user)}
          disabled={actions.busyToggleId === user.id}
          ariaLabel={`${user.name ?? user.email} active`}
        />
      </div>
      <div className="flex justify-end">
        <RowMenu user={user} actions={actions} />
      </div>
    </div>
  )
}

function StaffCard({ user, actions }: { user: StaffUser; actions: RowActions }) {
  return (
    <div
      className={cn(
        "rounded-[3px] border border-hair bg-background px-3.5 pb-3 pt-3.5",
        !user.active && "opacity-55",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] tracking-[0.02em] text-foreground">
            {user.name ?? "—"}
          </div>
          <div className="truncate text-[11.5px] text-brand-ink-soft">
            {user.email}
          </div>
        </div>
        <RowMenu user={user} actions={actions} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RoleChip role={user.role} />
          <span className="text-[11px] tracking-[0.02em] text-brand-ink-mute">
            {user.lastActiveAt ?? "—"}
          </span>
        </div>
        <Toggle
          on={user.active}
          onChange={() => actions.onToggleActive(user)}
          disabled={actions.busyToggleId === user.id}
          ariaLabel={`${user.name ?? user.email} active`}
        />
      </div>
    </div>
  )
}
