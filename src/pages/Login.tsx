import * as React from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  KanjiOrnament,
  Overline,
  TsunamiWordmark,
} from "@/components/brand"
import { useAuth } from "@/contexts/AuthContext"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
}

interface LocationState {
  from?: { pathname: string }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [submitting, setSubmitting] = React.useState(false)

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (!email) next.email = "Enter your email address."
    else if (!EMAIL_RE.test(email)) next.email = "That email doesn't look right."
    if (!password) next.password = "Enter your password."
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const result = await signIn(email, password)
      switch (result.kind) {
        case "tokens":
          navigate(redirectTo, { replace: true })
          break
        case "newPasswordRequired":
          navigate("/auth/welcome")
          break
        case "mfaSetup":
          navigate("/auth/totp-setup")
          break
        case "mfaPrompt":
          navigate("/auth/totp-prompt")
          break
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again."
      setErrors({ password: message })
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background bg-pinstripe",
        "flex items-center justify-center p-6 sm:p-10",
        "text-foreground font-sans",
      )}
    >
      <div className="flex w-full max-w-[420px] flex-col items-center sm:max-w-[440px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className={cn(
            "w-full bg-card rounded-md border border-hair",
            "px-7 pt-9 pb-8 sm:px-11 sm:pt-11 sm:pb-9",
            "shadow-[0_1px_2px_oklch(0.186_0.013_270/0.04),0_12px_40px_-12px_oklch(0.186_0.013_270/0.10)]",
            "dark:shadow-[0_1px_2px_oklch(0_0_0/0.4),0_12px_40px_-12px_oklch(0_0_0/0.6)]",
          )}
        >
          {/* Brand block */}
          <div className="mb-9 flex flex-col items-center gap-3.5 text-center">
            <KanjiOrnament char="津" size="md" />
            <TsunamiWordmark size="lg" />
            <KanjiOrnament char="波" size="md" />
            <Overline size="sm" className="mt-3">
              Reservation management
            </Overline>
            <span className="text-[11px] font-light italic text-brand-ink-mute tracking-[0.04em]">
              Staff access only
            </span>
          </div>

          {/* Divider */}
          <div className="-mx-3 mb-7 h-px bg-hair" />

          {/* Email */}
          <div className="mb-4">
            <Label htmlFor="email" className="mb-2 block">
              <Overline size="sm" tone="default">
                Email
              </Overline>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sushitsunami.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={submitting}
              className="h-11 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light tracking-[0.01em] placeholder:text-brand-ink-mute focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 md:text-sm"
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-[12px] font-normal text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <Label htmlFor="password" className="mb-2 block">
              <Overline size="sm" tone="default">
                Password
              </Overline>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={submitting}
              className="h-11 rounded-[3px] border-hair-strong bg-card px-3.5 text-sm font-light tracking-[0.01em] placeholder:text-brand-ink-mute focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 md:text-sm"
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 text-[12px] font-normal text-destructive"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[3px]",
              "text-[12px] font-medium uppercase tracking-[0.22em] text-primary-foreground",
              "bg-primary transition-colors duration-150 ease-out",
              "hover:bg-brand-red-dark",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            )}
          >
            {submitting ? (
              <>
                <Spinner />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>

          {/* Forgot password */}
          <div className="mt-5 text-center">
            <Link
              to="/auth/forgot"
              className="text-[12px] font-light tracking-[0.04em] text-brand-ink-soft border-b border-brand-hair-strong pb-px hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {/* Footer */}
        <Overline
          as="div"
          size="xs"
          tone="mute"
          className="mt-7 text-center"
        >
          Sushi Tsunami · Achrafieh
        </Overline>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span
      className={cn(
        "inline-block size-3 rounded-full border-[1.5px]",
        "border-primary-foreground/40 border-t-primary-foreground",
        "animate-spin",
      )}
      aria-hidden
    />
  )
}
