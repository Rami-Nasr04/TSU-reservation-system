import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Login from "@/pages/Login"

function HomePlaceholder() {
  const { user, signOut } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background bg-pinstripe text-foreground">
      <p className="text-sm tracking-[0.22em] uppercase text-brand-ink-mute">
        Signed in as {user?.email}
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        className="h-9 rounded-[3px] border border-hair-strong bg-card px-4 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground hover:bg-muted"
      >
        Sign out
      </button>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            path="/"
            element={
              <ProtectedRoute>
                <HomePlaceholder />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  )
}

export default App
