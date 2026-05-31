import * as React from "react"
import { Check, Copy, RefreshCw } from "lucide-react"
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
import { createUser } from "@/services/usersService"
import type { UserRole } from "@/contexts/AuthContext"

interface AddStaffModalProps {
  open: boolean
  onClose: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

const ROLES: { id: UserRole; label: string; hint: string }[] = [
  { id: "staff", label: "Staff", hint: "View-only: DayBoard + Calendar. No write actions." },
  { id: "host", label: "Host", hint: "Read + create today's reservations only." },
  { id: "supervisor", label: "Supervisor", hint: "Full DayBoard access. No settings or analytics." },
  { id: "manager", label: "Manager", hint: "Full access: analytics, settings, all reservations." },
]

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@%"
  let out = ""
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export function AddStaffModal({ open, onClose }: AddStaffModalProps) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("host")
  const [pwd, setPwd] = React.useState(generatePassword)
  const [copied, setCopied] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const canSave = name.trim().length > 0 && email.trim().length > 0
  const roleHint = ROLES.find((r) => r.id === role)?.hint

  async function copyPwd() {
    try {
      await navigator.clipboard.writeText(pwd)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy to clipboard.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      await createUser({ name: name.trim(), email: email.trim(), role })
      toast.success("Staff member created")
      onClose()
    } catch (err) {
      // Backend returns 501 until Cognito is wired (P10b).
      toast.error(err instanceof Error ? err.message : "Couldn't create account.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>
            They'll receive an email with sign-in instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-name" className={fieldLabel}>
              Full name
            </Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nadim Saad"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-email" className={fieldLabel}>
              Email
            </Label>
            <Input
              id="staff-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nadim@sushitsunami.com"
              inputMode="email"
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

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Temporary password</span>
            <div className="flex h-10 items-center gap-1.5 rounded-[3px] border border-hair-strong bg-background pl-3 pr-1.5">
              <span className="flex-1 font-mono text-[14px] tracking-[0.06em] text-foreground">
                {pwd}
              </span>
              <button
                type="button"
                onClick={() => setPwd(generatePassword())}
                aria-label="Regenerate password"
                className="inline-flex size-7 items-center justify-center rounded-[2px] text-brand-ink-soft transition-colors hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={copyPwd}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-[2px] px-2.5",
                  "text-[10px] font-medium uppercase tracking-[0.16em] transition-colors",
                  copied
                    ? "bg-primary/10 text-primary"
                    : "bg-foreground/[0.05] text-foreground hover:bg-foreground/10",
                )}
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] tracking-[0.02em] text-brand-ink-mute">
              Auto-generated · they'll be asked to change it on first sign-in.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Creating…" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
