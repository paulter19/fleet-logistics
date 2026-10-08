import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field, TextInput } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { isEmail, minLength, required } from '../utils/validation'

export function LoginPage() {
  const { user, login, demoLogin } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('demo@fleetlogistics.com')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    const emailErr = required(email, 'Email') ?? (isEmail(email) ? null : 'Enter a valid email.')
    const passErr = required(password, 'Password') ?? minLength(password, 6, 'Password')
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

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div>
          <div className="brand" style={{ padding: 0, border: 0 }}>
            <div className="brand-mark">HF</div>
            <div>
              <strong>Horizon Fleet</strong>
              <span>Logistics & management</span>
            </div>
          </div>
          <h1 style={{ marginTop: 36 }}>Run the fleet from one control tower.</h1>
          <p>
            Dispatch trips, watch assets, keep drivers legal, and catch maintenance before it strands a load.
          </p>
        </div>
        <div className="login-kpis">
          <div>
            <strong>12</strong>
            <span className="small">Units in demo</span>
          </div>
          <div>
            <strong>96%</strong>
            <span className="small">On-time last week</span>
          </div>
          <div>
            <strong>6.8</strong>
            <span className="small">Fleet MPG</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="muted small">Use the demo workspace or mocked credentials.</p>
          <div className="demo-note">
            Demo account: <strong>demo@fleetlogistics.com</strong> / <strong>demo123</strong>
          </div>
          <form className="stack" onSubmit={onSubmit}>
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
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setErrors({})
                try {
                  await demoLogin()
                } catch (err) {
                  setErrors({ form: err instanceof Error ? err.message : 'Demo login failed.' })
                } finally {
                  setBusy(false)
                }
              }}
            >
              Demo Login
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
