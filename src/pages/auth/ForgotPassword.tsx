import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Overline } from "@/components/brand"
import { cn } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!EMAIL_RE.test(email)) {
      setError("That email doesn't look right.")
      return
    }
    setSubmitting(true)
    try {
      await forgotPassword(email).catch(() => null)
      navigate("/auth/check-email", {
        state: { email },
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start password reset."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6 text-center">
          <Overline size="sm" className="mb-2 block">
            Account recovery
          </Overline>
          <div className="text-[18px] font-normal tracking-[0.02em] text-foreground mb-2">
            Forgot your password?
          </div>
          <div className="text-[12px] font-light text-brand-ink-soft leading-[1.55]">
            Enter your work email — we'll send a code to reset it.
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
          placeholder="you@sushitsunami.com"
          autoComplete="email"
          disabled={submitting}
          className="h-11 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light"
        />
        {error && (
          <p role="alert" className="mt-1.5 text-[12px] text-destructive">
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
          {submitting ? "Sending…" : "Send reset code"}
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
