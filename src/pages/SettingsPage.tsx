import { useEffect, useState, type FormEvent } from 'react'
import { PageGate } from '../components/PageGate'
import { ConfirmDialog } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Field, Select, TextInput } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { CompanySettings } from '../types'
import { required } from '../utils/validation'

export function SettingsPage() {
  const { user } = useAuth()
  const { data, loading, error, saveSettings, restoreDemoData } = useFleet()
  const { notify } = useToast()
  const [values, setValues] = useState<CompanySettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (data) setValues(data.settings)
  }, [data])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!values) return
    const err = required(values.name, 'Company name')
    setNameError(err)
    if (err) return
    setBusy(true)
    try {
      await saveSettings(values)
      notify('success', 'Settings saved', 'Stored locally in this browser only.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data && values)}>
      {values ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Settings</h1>
              <p>Company preferences for the demo workspace</p>
            </div>
          </div>
          <div className="detail-grid">
            <section className="card card-pad">
              <h2>Company</h2>
              <form className="stack" style={{ marginTop: 16 }} onSubmit={submit}>
                <Field label="Company name" error={nameError}>
                  <TextInput value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                </Field>
                <Field label="Home terminal">
                  <TextInput value={values.terminal} onChange={(e) => setValues({ ...values, terminal: e.target.value })} />
                </Field>
                <Field label="Timezone">
                  <Select value={values.timezone} onChange={(e) => setValues({ ...values, timezone: e.target.value })}>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </Select>
                </Field>
                <Field label="Unit system">
                  <Select
                    value={values.unitSystem}
                    onChange={(e) => setValues({ ...values, unitSystem: e.target.value as CompanySettings['unitSystem'] })}
                  >
                    <option value="imperial">Imperial</option>
                    <option value="metric">Metric</option>
                  </Select>
                </Field>
                <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={values.emailAlerts}
                    onChange={(e) => setValues({ ...values, emailAlerts: e.target.checked })}
                  />
                  Email alerts (mocked)
                </label>
                <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={values.smsAlerts}
                    onChange={(e) => setValues({ ...values, smsAlerts: e.target.checked })}
                  />
                  SMS alerts (mocked)
                </label>
                <div>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Saving…' : 'Save settings'}
                  </Button>
                </div>
              </form>
            </section>
            <section className="card card-pad">
              <h2>Session</h2>
              <dl className="kv" style={{ marginTop: 14 }}>
                <dt>Signed in</dt>
                <dd>{user?.name}</dd>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
                <dt>Role</dt>
                <dd>{user?.role.replace('_', ' ')}</dd>
              </dl>
              <p className="muted small" style={{ marginTop: 16 }}>
                Auth and fleet data persist in localStorage. Nothing is sent to a server.
              </p>
              <Button variant="danger" style={{ marginTop: 16 }} onClick={() => setResetOpen(true)}>
                Restore demo data
              </Button>
            </section>
          </div>
          <ConfirmDialog
            open={resetOpen}
            title="Restore seed data?"
            body="This overwrites local edits and reloads the original demo fleet."
            confirmLabel="Restore"
            busy={busy}
            onCancel={() => setResetOpen(false)}
            onConfirm={async () => {
              setBusy(true)
              try {
                await restoreDemoData()
                notify('success', 'Demo data restored')
                setResetOpen(false)
              } finally {
                setBusy(false)
              }
            }}
          />
        </div>
      ) : null}
    </PageGate>
  )
}
