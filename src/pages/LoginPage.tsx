import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field, TextInput } from '../components/ui/Field'
import { demoUsers } from '../data/seed'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/permissions'
import { isEmail, minLength, required } from '../utils/validation'

export function LoginPage() {
  const { user, login, demoLogin } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('demo@fleetlogistics.com')
  const [password, setPassword] = useState('demo123')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    const emailErr = required(email, 'Email') ?? (isEmail(email) ? null : 'Enter a valid email.')
    const passErr = required(password, 'Password') ?? minLength(password, 4, 'Password')
    if (emailErr) next.email = emailErr
    if (passErr) next.password = passErr
    setErrors(next)
    if (next.email || next.password) return
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Unable to sign in.' })
    } finally {
      setBusy(false)
    }
  }

  const handleDemoSignIn = async (roleOrId?: string) => {
    setBusy(true)
    setErrors({})
    try {
      await demoLogin(roleOrId)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Demo login failed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div>
          <div className="brand" style={{ padding: 0, border: 0 }}>
            <div className="brand-mark">HF</div>
            <div>
              <strong>Horizon Fleet</strong>
              <span>Logistics & Management</span>
            </div>
          </div>
          <h1 style={{ marginTop: 36 }}>Run the fleet from one control tower.</h1>
          <p>
            Dispatch trips, track assets, enforce safety & DVIR compliance, and empower operations with role-based access.
          </p>
        </div>
        <div className="login-kpis">
          <div>
            <strong>12</strong>
            <span className="small">Active Units</span>
          </div>
          <div>
            <strong>5</strong>
            <span className="small">Role Tiers</span>
          </div>
          <div>
            <strong>96%</strong>
            <span className="small">On-time Rate</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="muted small">Sign in with an account or launch as a role persona.</p>

          <form className="stack" onSubmit={onSubmit} style={{ marginBottom: 20 }}>
            <Field label="Email" error={errors.email}>
              <TextInput
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <TextInput
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {errors.form ? <div className="error-banner">{errors.form}</div> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in with Password'}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={busy}
              onClick={() => handleDemoSignIn('usr-admin')}
            >
              ⚡ Instant Demo Login (Admin)
            </Button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sign in as a Sub-Role Persona:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleDemoSignIn(u.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text)',
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-bright)' }}>{u.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
