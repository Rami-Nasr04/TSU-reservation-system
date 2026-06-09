import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { patchUser, type StaffUser } from "@/services/usersService"
import type { UserRole } from "@/contexts/AuthContext"

interface EditStaffModalProps {
  user: StaffUser
  open: boolean
  onClose: () => void
  /** Called after a successful save so the staff list refetches. */
  onSaved?: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

const ROLES: { id: UserRole; label: string; hint: string }[] = [
  { id: "staff", label: "Staff", hint: "View-only: DayBoard + Calendar. No write actions." },
  { id: "host", label: "Host", hint: "Read + create today's reservations only." },
  { id: "supervisor", label: "Supervisor", hint: "Full DayBoard access. No settings or analytics." },
  { id: "manager", label: "Manager", hint: "Full access: analytics, settings, all reservations." },
]

export function EditStaffModal({ user, open, onClose, onSaved }: EditStaffModalProps) {
  const [name, setName] = React.useState(user.name ?? "")
  const [role, setRole] = React.useState<UserRole>(user.role)
  const [saving, setSaving] = React.useState(false)

  const trimmedName = name.trim()
  const dirty = trimmedName !== (user.name ?? "") || role !== user.role
  const canSave = trimmedName.length > 0 && dirty
  const roleHint = ROLES.find((r) => r.id === role)?.hint

  function handleOpenChange(next: boolean) {
    if (next || saving) return
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      const patch: { name?: string; role?: UserRole } = {}
      if (trimmedName !== (user.name ?? "")) patch.name = trimmedName
      if (role !== user.role) patch.role = role
      await patchUser(user.id, patch)
      toast.success("Staff member updated")
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update account.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit staff</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-staff-name" className={fieldLabel}>
              Full name
            </Label>
            <Input
              id="edit-staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nadim Saad"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Role</span>
            <div className="inline-flex w-fit items-center gap-0.5 rounded-[3px] bg-foreground/[0.04] p-[3px]">
              {ROLES.map((r) => {
                const isActive = r.id === role
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "rounded-[2px] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors duration-150",
                      isActive
                        ? "bg-card font-medium text-foreground shadow-sm"
                        : "font-normal text-brand-ink-soft hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11.5px] tracking-[0.02em] text-brand-ink-soft">
              {roleHint}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
