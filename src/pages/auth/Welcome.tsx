import * as React from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import {
  PasswordStrength,
  isStrongPassword,
} from "@/components/auth/PasswordStrength"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Overline } from "@/components/brand"
import { cn } from "@/lib/utils"

export default function Welcome() {
  const navigate = useNavigate()
  const { pendingChallenge, completeNewPassword } = useAuth()

  const [pw, setPw] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (pendingChallenge?.kind !== "newPasswordRequired") {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isStrongPassword(pw)) {
      setError("Password doesn't meet the requirements.")
      return
    }
    if (pw !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    try {
      const result = await completeNewPassword(pw)
      if (result.kind === "tokens") {
        toast.success("Welcome!")
        navigate("/", { replace: true })
      } else if (result.kind === "mfaSetup") {
        navigate("/auth/totp-setup", { replace: true })
      } else if (result.kind === "mfaPrompt") {
        navigate("/auth/totp-prompt", { replace: true })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not set password."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5 text-center">
          <Overline size="sm" tone="default" className="mb-2 block text-primary">
            Welcome to TSU
          </Overline>
          <div className="text-[18px] font-normal tracking-[0.02em] text-foreground mb-2">
            Set your password
          </div>
          <div className="text-[12px] font-light text-brand-ink-soft leading-[1.55]">
            Replace the temporary password to get started.
          </div>
        </div>

        <Label htmlFor="pw" className="mb-2 block">
          <Overline size="sm">New password</Overline>
        </Label>
        <Input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={submitting}
          autoFocus
          className="h-11 mb-3 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light"
        />

        <Label htmlFor="confirm" className="mb-2 block">
          <Overline size="sm">Confirm new password</Overline>
        </Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          autoComplete="new-password"
          disabled={submitting}
          className="h-11 mb-2 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light"
        />

        <PasswordStrength password={pw} />

        {error && (
          <p role="alert" className="mt-3 text-[12px] text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "mt-4 flex h-[46px] w-full items-center justify-center rounded-[3px]",
            "text-[12px] font-medium uppercase tracking-[0.22em] text-primary-foreground",
            "bg-primary hover:bg-brand-red-dark transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {submitting ? "Continuing…" : "Continue to TSU"}
        </button>
      </form>
    </AuthCard>
  )
}
