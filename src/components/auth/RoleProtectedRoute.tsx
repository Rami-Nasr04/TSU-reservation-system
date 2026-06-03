import * as React from "react"
import { Navigate } from "react-router-dom"
import { useAuth, type UserRole } from "@/contexts/AuthContext"

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) {
  const { hasRole } = useAuth()
  const ok = allowedRoles.some((r) => hasRole(r))
  if (!ok) return <Navigate to="/" replace />
  return <>{children}</>
}
