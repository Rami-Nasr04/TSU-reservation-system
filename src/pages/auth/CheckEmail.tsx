import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { AuthCard } from "@/components/auth/AuthCard"
import { cn } from "@/lib/utils"

interface LocationState {
  email?: string
  destination?: string
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@")
  if (!domain) return email
  if (name.length <= 2) return `${name[0] ?? ""}*@${domain}`
  return `${name[0]}${"*".repeat(Math.max(1, name.length - 2))}${name.slice(-1)}@${domain}`
}

export default function CheckEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { forgotPassword } = useAuth()
  const state = (location.state as LocationState | null) ?? {}
  const email = state.email ?? ""
  const [countdown, setCountdown] = React.useState(60)
  const [resending, setResending] = React.useState(false)

  React.useEffect(() => {
    if (!email) {
      navigate("/auth/forgot", { replace: true })
    }
  }, [email, navigate])

  React.useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleResend() {
    if (countdown > 0 || resending || !email) return
    setResending(true)
    try {
      await forgotPassword(email).catch(() => null)
      toast.success("Code resent.")
      setCountdown(60)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard>
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-[18px] w-[18px]" />
        </div>
        <div className="text-[18px] font-normal tracking-[0.02em] text-foreground mb-2">
          Check your email
        </div>
        <div className="text-[12.5px] font-light text-brand-ink-soft leading-[1.6] mb-1">
          We sent a reset code to
        </div>
        <div className="text-[13px] tracking-[0.02em] text-foreground mb-3">
          {maskEmail(email)}
        </div>
        <div className="text-[11.5px] text-brand-ink-mute tracking-[0.02em] mb-5">
          The code expires in 30 minutes.
        </div>
        <button
          type="button"
          onClick={() => navigate("/auth/reset", { state: { email } })}
          className={cn(
            "flex h-[46px] w-full items-center justify-center rounded-[3px]",
            "text-[12px] font-medium uppercase tracking-[0.22em] text-primary-foreground",
            "bg-primary hover:bg-brand-red-dark transition-colors",
          )}
        >
          Continue to reset
        </button>
        <a
          href="mailto:"
          className={cn(
            "mt-3 flex h-11 w-full items-center justify-center rounded-[3px]",
            "border border-hair-strong text-[11px] font-medium uppercase tracking-[0.22em] text-foreground",
            "hover:bg-card",
          )}
        >
          Open mail app
        </a>
        <div className="mt-4 text-[11.5px] text-brand-ink-soft">
          Didn't receive it?{" "}
          {countdown > 0 ? (
            <span className="text-foreground">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-foreground underline underline-offset-2 disabled:opacity-60"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
          )}
        </div>
        <div className="mt-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[12px] font-light tracking-[0.04em] text-brand-ink-soft hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthCard>
  )
}
