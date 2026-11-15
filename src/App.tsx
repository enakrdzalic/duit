import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

function MainApp() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<MainApp />}>
            <Route path="/" element={<AppShell />} />
            <Route path="/c/:categoryId" element={<AppShell />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
