import * as React from "react"
import { Check, Copy } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { resetUserPassword, type StaffUser } from "@/services/usersService"

interface ResetPasswordDialogProps {
  user: StaffUser
  open: boolean
  onClose: () => void
}

const fieldLabel = "text-[10.5px] font-medium uppercase tracking-[0.18em] text-brand-ink-soft"

export function ResetPasswordDialog({ user, open, onClose }: ResetPasswordDialogProps) {
  const [busy, setBusy] = React.useState(false)
  const [tempPassword, setTempPassword] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  function handleOpenChange(next: boolean) {
    if (next || busy) return
    onClose()
  }

  async function handleReset() {
    if (busy) return
    setBusy(true)
    try {
      const pwd = await resetUserPassword(user.id)
      setTempPassword(pwd)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset the password.")
    } finally {
      setBusy(false)
    }
  }

  async function copyPwd() {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy to clipboard.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Password reset</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <span className={fieldLabel}>New temporary password</span>
              <div className="flex h-10 items-center gap-1.5 rounded-[3px] border border-hair-strong bg-background pl-3 pr-1.5">
                <span className="flex-1 font-mono text-[14px] tracking-[0.06em] text-foreground">
                  {tempPassword}
                </span>
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
                Share this with them. Their old password no longer works; they'll
                set a new one on next sign-in.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reset password?</DialogTitle>
              <DialogDescription>
                {user.name ?? user.email}'s current password will stop working
                immediately. You'll get a new temporary password to share.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleReset} disabled={busy}>
                {busy ? "Resetting…" : "Reset password"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
