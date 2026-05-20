import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import Login from "@/pages/Login"
import Calendar from "@/pages/Calendar"
import DayBoard from "@/pages/DayBoard"
import Customers from "@/pages/Customers"

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
    <ThemeProvider>
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
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/day/:date"
              element={
                <ProtectedRoute>
                  <DayBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
