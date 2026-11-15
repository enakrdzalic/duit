import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { DuitMark } from '../components/DuitMark'
import { useAuth } from '../context/AuthContext'

type Mode = 'signin' | 'signup' | 'forgot'

const FADE_MS = 200

export function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [panelIn, setPanelIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const switching = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  function switchMode(next: Mode) {
    if (next === mode || switching.current) return
    switching.current = true
    setError(null)
    setMessage(null)
    setPanelIn(false)

    const outId = window.setTimeout(() => {
      setMode(next)
      // Next frame so the new panel mounts hidden, then fades in.
      const inId = window.setTimeout(() => {
        setPanelIn(true)
        switching.current = false
      }, 30)
      timers.current.push(inId)
    }, FADE_MS)
    timers.current.push(outId)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const err = await resetPassword(email.trim())
        if (err) setError(err)
        else setMessage('Check your email for a reset link.')
        return
      }
      if (mode === 'signup') {
        const err = await signUp(email.trim(), password)
        if (err) {
          if (err.startsWith('Check your email')) setMessage(err)
          else setError(err)
          return
        }
        navigate('/', { replace: true })
        return
      }
      const err = await signIn(email.trim(), password)
      if (err) setError(err)
      else navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="sparkle sparkle--a" aria-hidden>
        ✦
      </div>
      <div className="sparkle sparkle--b" aria-hidden>
        ✦
      </div>

      <header className="brand-bar">
        <Link to="/" className="brand">
          <DuitMark size="lg" />
          <h1>düit</h1>
        </Link>
      </header>

      <form className="auth-card" onSubmit={onSubmit}>
        <div
          key={mode}
          className={`auth-card__panel${panelIn ? ' is-in' : ''}`}
        >
          <h2 className="auth-card__title">
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="auth-card__hint">
            {mode === 'forgot'
              ? 'Enter your email and we’ll send a reset link.'
              : mode === 'signup'
                ? 'Save your todos so they follow you to any device.'
                : 'Sign in to sync todos across desktop and phone.'}
          </p>

          <label className="auth-field">
            <span>email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== 'forgot' && (
            <label className="auth-field">
              <span>password</span>
              <input
                type="password"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && <p className="auth-card__error">{error}</p>}
          {message && <p className="auth-card__message">{message}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy
              ? '…'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>

          <div className="auth-card__links">
            {mode === 'signin' && (
              <>
                <button type="button" onClick={() => switchMode('signup')}>
                  New here? Create an account
                </button>
                <button type="button" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button type="button" onClick={() => switchMode('signin')}>
                Already have an account? Sign in
              </button>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => switchMode('signin')}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
