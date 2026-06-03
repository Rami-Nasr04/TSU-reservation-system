import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { RoleProtectedRoute } from "./RoleProtectedRoute"
import type { UserRole } from "@/contexts/AuthContext"

vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/contexts/AuthContext")>(
    "@/contexts/AuthContext",
  )
  return { ...actual, useAuth: vi.fn() }
})
import { useAuth } from "@/contexts/AuthContext"

function setup(groups: UserRole[], allowed: UserRole[]) {
  vi.mocked(useAuth).mockReturnValue({
    userGroups: groups,
    hasRole: (r: UserRole) => groups.includes(r),
  } as unknown as ReturnType<typeof useAuth>)
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route
          path="/protected"
          element={
            <RoleProtectedRoute allowedRoles={allowed}>
              <div>OK</div>
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("RoleProtectedRoute", () => {
  it("renders children when user has any allowed role", () => {
    setup(["manager"], ["manager"])
    expect(screen.getByText("OK")).toBeInTheDocument()
  })

  it("redirects to / when user lacks every allowed role", () => {
    setup(["host"], ["manager"])
    expect(screen.getByText("HOME")).toBeInTheDocument()
  })

  it("renders children when user has multi-role overlap", () => {
    setup(["manager", "staff"], ["manager"])
    expect(screen.getByText("OK")).toBeInTheDocument()
  })

  it("redirects when userGroups empty", () => {
    setup([], ["manager", "supervisor"])
    expect(screen.getByText("HOME")).toBeInTheDocument()
  })
})
