import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import { DigitInput } from "@/components/auth/DigitInput"
import {
  PasswordStrength,
  isStrongPassword,
} from "@/components/auth/PasswordStrength"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Overline } from "@/components/brand"
import { cn } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LocationState {
  email?: string
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetPassword } = useAuth()
  const initialEmail = (location.state as LocationState | null)?.email ?? ""

  const [email, setEmail] = React.useState(initialEmail)
  const [code, setCode] = React.useState("")
  const [pw, setPw] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!EMAIL_RE.test(email)) {
      setError("That email doesn't look right.")
      return
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.")
      return
    }
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
      await resetPassword(email, code, pw)
      toast.success("Password updated. Sign in with your new password.")
      navigate("/login", { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not reset password."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5 text-center">
          <Overline size="sm" className="mb-2 block">
            Reset password
          </Overline>
          <div className="text-[18px] font-normal tracking-[0.02em] text-foreground">
            Choose a new password
          </div>
        </div>

        <Label htmlFor="email" className="mb-2 block">
          <Overline size="sm">Email</Overline>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={submitting}
          className="h-11 mb-3 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light"
        />

        <Overline size="sm" className="mb-2 block">
          Reset code
        </Overline>
        <DigitInput
          value={code}
          onChange={setCode}
          disabled={submitting}
          className="mb-4"
        />

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
          {submitting ? "Updating…" : "Update password"}
        </button>

        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[12px] font-light tracking-[0.04em] text-brand-ink-soft hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}
