import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { TablesProvider } from "@/contexts/TablesContext"
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute"
import Login from "@/pages/Login"
import Calendar from "@/pages/Calendar"

const DayBoard = lazy(() => import("@/pages/DayBoard"))
const ServiceMode = lazy(() => import("@/pages/ServiceMode"))
const Customers = lazy(() => import("@/pages/Customers"))
const Settings = lazy(() => import("@/pages/Settings"))
const Analytics = lazy(() => import("@/pages/Analytics"))
const NotFound = lazy(() => import("@/pages/states/NotFound"))

const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"))
const CheckEmail = lazy(() => import("@/pages/auth/CheckEmail"))
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"))
const Welcome = lazy(() => import("@/pages/auth/Welcome"))
const TotpSetup = lazy(() => import("@/pages/auth/TotpSetup"))
const TotpPrompt = lazy(() => import("@/pages/auth/TotpPrompt"))

function PageFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="text-[11px] uppercase tracking-[0.22em] text-brand-ink-mute">
        Loading…
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageFallback />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageFallback />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/auth/forgot"
                element={
                  <PublicOnlyRoute>
                    <ForgotPassword />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/auth/check-email"
                element={
                  <PublicOnlyRoute>
                    <CheckEmail />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/auth/reset"
                element={
                  <PublicOnlyRoute>
                    <ResetPassword />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/auth/welcome" element={<Welcome />} />
              <Route path="/auth/totp-setup" element={<TotpSetup />} />
              <Route path="/auth/totp-prompt" element={<TotpPrompt />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/day/:date"
                element={
                  <ProtectedRoute>
                    <TablesProvider>
                      <DayBoard />
                    </TablesProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/day/:date/service"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute
                      allowedRoles={["manager", "supervisor", "host"]}
                    >
                      <TablesProvider>
                        <ServiceMode />
                      </TablesProvider>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute
                      allowedRoles={["manager", "supervisor", "host"]}
                    >
                      <Customers />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={["manager"]}>
                      <Settings />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={["manager"]}>
                      <Analytics />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
