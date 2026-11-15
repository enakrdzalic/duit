import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DuitMark } from '../components/DuitMark'
import { useAuth } from '../context/AuthContext'

export function ResetPasswordPage() {
  const { updatePassword, user } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const err = await updatePassword(password)
      if (err) {
        setError(err)
        return
      }
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <header className="brand-bar">
        <Link to="/" className="brand">
          <DuitMark size="lg" />
          <h1>düit</h1>
        </Link>
      </header>

      <form className="auth-card" onSubmit={onSubmit}>
        <h2 className="auth-card__title">new password</h2>
        <p className="auth-card__hint">
          {user
            ? 'Choose a new password for your account.'
            : 'Open the reset link from your email first, then set a new password.'}
        </p>

        <label className="auth-field">
          <span>new password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!user}
          />
        </label>

        {error && <p className="auth-card__error">{error}</p>}

        <button className="auth-submit" type="submit" disabled={busy || !user}>
          {busy ? '…' : 'save password'}
        </button>

        <div className="auth-card__links">
          <Link to="/login">back to sign in</Link>
        </div>
      </form>
    </div>
  )
}
