import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, act, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "./AuthContext"

vi.mock("@/lib/cognito", () => ({
  initiateUserPasswordAuth: vi.fn(),
  initiateRefresh: vi.fn(),
  respondNewPassword: vi.fn(),
  associateSoftwareToken: vi.fn(),
  verifySoftwareToken: vi.fn(),
  respondMfaSetup: vi.fn(),
  respondSoftwareTokenMfa: vi.fn(),
  parseIdTokenClaims: vi.fn(() => ({
    sub: "s1",
    email: "a@b.com",
    name: "Alice",
    groups: ["manager"],
    exp: Math.floor(Date.now() / 1000) + 3600,
  })),
}))

import { initiateUserPasswordAuth } from "@/lib/cognito"

function Probe({
  onReady,
}: {
  onReady: (ctx: ReturnType<typeof useAuth>) => void
}) {
  const ctx = useAuth()
  onReady(ctx)
  return null
}

describe("AuthContext.signIn discriminated return", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(initiateUserPasswordAuth).mockReset()
  })

  it("returns {kind:'tokens'} on AuthenticationResult", async () => {
    vi.mocked(initiateUserPasswordAuth).mockResolvedValueOnce({
      authenticationResult: {
        AccessToken: "a",
        IdToken: "i.i.i",
        RefreshToken: "r",
        ExpiresIn: 3600,
      },
    })
    let ctx!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )
    await waitFor(() => expect(ctx.isLoading).toBe(false))
    let result!: Awaited<ReturnType<typeof ctx.signIn>>
    await act(async () => {
      result = await ctx.signIn("a@b.com", "pw")
    })
    expect(result).toEqual({ kind: "tokens" })
    expect(ctx.isAuthenticated).toBe(true)
  })

  it("returns {kind:'newPasswordRequired'} on NEW_PASSWORD_REQUIRED", async () => {
    vi.mocked(initiateUserPasswordAuth).mockResolvedValueOnce({
      challengeName: "NEW_PASSWORD_REQUIRED",
      session: "sess-1",
    })
    let ctx!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )
    await waitFor(() => expect(ctx.isLoading).toBe(false))
    let result!: Awaited<ReturnType<typeof ctx.signIn>>
    await act(async () => {
      result = await ctx.signIn("a@b.com", "pw")
    })
    expect(result).toEqual({ kind: "newPasswordRequired" })
    expect(ctx.pendingChallenge?.kind).toBe("newPasswordRequired")
    expect(
      ctx.pendingChallenge?.kind === "newPasswordRequired"
        ? ctx.pendingChallenge.session
        : null,
    ).toBe("sess-1")
    expect(ctx.isAuthenticated).toBe(false)
  })

  it("returns {kind:'mfaSetup'} on MFA_SETUP", async () => {
    vi.mocked(initiateUserPasswordAuth).mockResolvedValueOnce({
      challengeName: "MFA_SETUP",
      session: "sess-2",
    })
    let ctx!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )
    await waitFor(() => expect(ctx.isLoading).toBe(false))
    let result!: Awaited<ReturnType<typeof ctx.signIn>>
    await act(async () => {
      result = await ctx.signIn("a@b.com", "pw")
    })
    expect(result).toEqual({ kind: "mfaSetup" })
    expect(ctx.pendingChallenge?.kind).toBe("mfaSetup")
  })

  it("returns {kind:'mfaPrompt'} on SOFTWARE_TOKEN_MFA", async () => {
    vi.mocked(initiateUserPasswordAuth).mockResolvedValueOnce({
      challengeName: "SOFTWARE_TOKEN_MFA",
      session: "sess-3",
    })
    let ctx!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onReady={(c) => (ctx = c)} />
      </AuthProvider>,
    )
    await waitFor(() => expect(ctx.isLoading).toBe(false))
    let result!: Awaited<ReturnType<typeof ctx.signIn>>
    await act(async () => {
      result = await ctx.signIn("a@b.com", "pw")
    })
    expect(result).toEqual({ kind: "mfaPrompt" })
    expect(ctx.pendingChallenge?.kind).toBe("mfaPrompt")
  })
})
