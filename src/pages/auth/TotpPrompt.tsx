import * as React from "react"
import { Link, useNavigate, Navigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import { DigitInput } from "@/components/auth/DigitInput"
import { Overline } from "@/components/brand"
import { cn } from "@/lib/utils"

export default function TotpPrompt() {
  const navigate = useNavigate()
  const { pendingChallenge, confirmMfa } = useAuth()

  const [code, setCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (pendingChallenge?.kind !== "mfaPrompt") {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your app.")
      return
    }
    setSubmitting(true)
    try {
      const result = await confirmMfa(code)
      if (result.kind === "tokens") {
        toast.success("Signed in.")
        navigate("/", { replace: true })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Code is incorrect or expired."
      setError(message)
      setCode("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5 text-center">
          <Overline size="sm" className="mb-2 block">
            Two-factor verification
          </Overline>
          <div className="text-[18px] font-normal tracking-[0.02em] text-foreground mb-2">
            Enter your code
          </div>
          <div className="text-[12px] font-light text-brand-ink-soft leading-[1.55]">
            Open your authenticator app and enter the 6-digit code.
          </div>
        </div>

        <DigitInput
          value={code}
          onChange={setCode}
          autoFocus
          disabled={submitting}
          className="mb-4"
        />

        {error && (
          <p
            role="alert"
            className="mb-3 text-center text-[12px] text-destructive"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className={cn(
            "flex h-[46px] w-full items-center justify-center rounded-[3px]",
            "text-[12px] font-medium uppercase tracking-[0.22em] text-primary-foreground",
            "bg-primary hover:bg-brand-red-dark transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {submitting ? "Verifying…" : "Verify code"}
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
