import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BootScreen } from './components/BootScreen'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

/** Match boot bounce (0.85s + last stagger) before reveal. */
const BOOT_MIN_MS = 1100

function RevealGate() {
  const { ready } = useApp()
  const [minDone, setMinDone] = useState(false)
  const [phase, setPhase] = useState<'boot' | 'out' | 'app'>('boot')
  const [appIn, setAppIn] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMinDone(true), BOOT_MIN_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (ready && minDone && phase === 'boot') setPhase('out')
  }, [ready, minDone, phase])

  useEffect(() => {
    if (phase !== 'out' && phase !== 'app') {
      setAppIn(false)
      return
    }
    const id = window.requestAnimationFrame(() => setAppIn(true))
    return () => window.cancelAnimationFrame(id)
  }, [phase])

  return (
    <>
      {(phase === 'out' || phase === 'app') && (
        <div className={`app-reveal${appIn ? ' is-in' : ''}`}>
          <Outlet />
        </div>
      )}
      {phase !== 'app' && (
        <BootScreen
          fadingOut={phase === 'out'}
          onFadedOut={() => setPhase('app')}
        />
      )}
    </>
  )
}

function MainApp() {
  const { loading } = useAuth()
  if (loading) return <BootScreen />

  return (
    <AppProvider>
      <RevealGate />
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
