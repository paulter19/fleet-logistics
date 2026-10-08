import { useEffect, useState, type FormEvent } from 'react'
import { PageGate } from '../components/PageGate'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { Field, Select, TextInput } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { CompanySettings, User, UserInput, UserRole, UserStatus } from '../types'
import {
  canManageUsers,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from '../utils/permissions'
import { isEmail, required } from '../utils/validation'

export function SettingsPage() {
  const { user, switchPersona, refreshSession } = useAuth()
  const {
    data,
    loading,
    error,
    saveSettings,
    restoreDemoData,
    createUser,
    elevateUserRole,
    updateUserStatus,
    deleteUser,
  } = useFleet()
  const { notify } = useToast()

  const [values, setValues] = useState<CompanySettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Team Member Add Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newUserData, setNewUserData] = useState<UserInput>({
    name: '',
    email: '',
    role: 'dispatcher',
    title: 'Dispatch Assistant',
    company: 'Horizon Fleet Logistics',
    status: 'active',
    phone: '',
  })
  const [newUserErrors, setNewUserErrors] = useState<{ name?: string; email?: string; title?: string }>({})

  // User delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  useEffect(() => {
    if (data) setValues(data.settings)
  }, [data])

  const isAdmin = canManageUsers(user?.role)
  const usersList = data?.users || []

  const submitCompanySettings = async (event: FormEvent) => {
    event.preventDefault()
    if (!values) return
    const err = required(values.name, 'Company name')
    setNameError(err)
    if (err) return
    setBusy(true)
    try {
      await saveSettings(values)
      notify('success', 'Settings saved', 'Company preferences updated in local mock storage.')
    } finally {
      setBusy(false)
    }
  }

  const handleRoleElevation = async (targetUser: User, nextRole: UserRole) => {
    if (!isAdmin) {
      notify('error', 'Access Denied', 'Only Fleet Operations Managers can elevate or change user roles.')
      return
    }
    setBusy(true)
    try {
      await elevateUserRole(targetUser.id, nextRole)
      refreshSession()
      notify(
        'success',
        'Role elevated / updated',
        `${targetUser.name} is now designated as ${ROLE_LABELS[nextRole]}.`,
      )
    } catch (err) {
      notify('error', 'Failed to update role', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  const handleStatusToggle = async (targetUser: User) => {
    if (!isAdmin) return
    if (targetUser.id === user?.id) {
      notify('error', 'Action prohibited', 'You cannot suspend your own active account.')
      return
    }
    const nextStatus: UserStatus = targetUser.status === 'active' ? 'suspended' : 'active'
    setBusy(true)
    try {
      await updateUserStatus(targetUser.id, nextStatus)
      refreshSession()
      notify(
        'info',
        `Account ${nextStatus}`,
        `${targetUser.name}'s account status set to ${nextStatus}.`,
      )
    } finally {
      setBusy(false)
    }
  }

  const handleCreateUserSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errs: typeof newUserErrors = {}
    const nameErr = required(newUserData.name, 'Full name')
    const emailErr = required(newUserData.email, 'Email') ?? (isEmail(newUserData.email) ? null : 'Invalid email')
    const titleErr = required(newUserData.title, 'Job title')
    if (nameErr) errs.name = nameErr
    if (emailErr) errs.email = emailErr
    if (titleErr) errs.title = titleErr
    setNewUserErrors(errs)

    if (nameErr || emailErr || titleErr) return

    setBusy(true)
    try {
      await createUser(newUserData)
      notify('success', 'Team Member Added', `${newUserData.name} was added as ${ROLE_LABELS[newUserData.role]}.`)
      setAddModalOpen(false)
      setNewUserData({
        name: '',
        email: '',
        role: 'dispatcher',
        title: 'Dispatch Specialist',
        company: 'Horizon Fleet Logistics',
        status: 'active',
        phone: '',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteUserConfirm = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteUser(deleteTarget.id)
      notify('info', 'Team member removed', `${deleteTarget.name} has been deleted.`)
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data && values)}>
      {values ? (
        <div className="page stack" style={{ gap: 24 }}>
          <div className="page-header">
            <div>
              <h1>Settings & Team Management</h1>
              <p>Company configuration, sub-user accounts, and Role-Based Access Control (RBAC)</p>
            </div>
            {isAdmin && (
              <Button variant="accent" onClick={() => setAddModalOpen(true)}>
                + Add Team User
              </Button>
            )}
          </div>

          {/* RBAC Team Management Card */}
          <section className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Team Members & Role Privilege Elevation</h2>
                <p className="muted small" style={{ marginTop: 4 }}>
                  Users operating under the Fleet Operations Manager. Admins can elevate roles, adjust access tiers, or suspend accounts in hardcoded local state.
                </p>
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: isAdmin ? 'var(--accent-subtle, rgba(99, 102, 241, 0.15))' : 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: isAdmin ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {isAdmin ? '🛡️ Admin Privilege Active (Elevations Enabled)' : '🔒 Read-Only (Fleet Manager Privileges Required)'}
              </div>
            </div>

            {!isAdmin && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: '#fbbf2415',
                  border: '1px solid #fbbf2444',
                  color: '#fbbf24',
                  fontSize: '0.8rem',
                }}
              >
                ⚠️ <strong>Note:</strong> You are currently logged in as <strong>{user?.name} ({ROLE_LABELS[user?.role ?? 'driver']})</strong>. Only Fleet Operations Managers have admin rights to elevate privileges or invite new staff. Use the <strong>Persona Switcher</strong> in the top bar to switch to the Admin profile to test elevation.
              </div>
            )}

            {/* Team Members Table */}
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>User & Title</th>
                    <th>Contact</th>
                    <th>Assigned Role & Privilege</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const pill = ROLE_COLORS[u.role]
                    const isSelf = u.id === user?.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                            {u.name} {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>(You)</span>}
                          </div>
                          <div className="small muted">{u.title}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>{u.email}</div>
                          {u.phone && <div className="small muted">{u.phone}</div>}
                        </td>
                        <td>
                          {isAdmin ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <select
                                value={u.role}
                                disabled={busy}
                                onChange={(e) => handleRoleElevation(u, e.target.value as UserRole)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  background: pill.bg,
                                  color: pill.text,
                                  border: `1px solid ${pill.border}`,
                                  cursor: 'pointer',
                                }}
                              >
                                <option value="fleet_manager">👑 Fleet Manager (Admin)</option>
                                <option value="dispatcher">🚚 Dispatcher</option>
                                <option value="staff">📋 Operations Associate (Staff)</option>
                                <option value="safety_officer">🛡️ Safety & Compliance</option>
                                <option value="mechanic">🔧 Maintenance Tech</option>
                                <option value="driver">🚛 Commercial Driver</option>
                              </select>
                            </div>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                background: pill.bg,
                                color: pill.text,
                                border: `1px solid ${pill.border}`,
                              }}
                            >
                              {ROLE_LABELS[u.role]}
                            </span>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 260 }}>
                            {ROLE_DESCRIPTIONS[u.role]}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: u.status === 'active' ? '#34d39922' : '#f8717122',
                              color: u.status === 'active' ? '#34d399' : '#f87171',
                              border: `1px solid ${u.status === 'active' ? '#34d39944' : '#f8717144'}`,
                            }}
                          >
                            ● {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <Button
                              variant="ghost"
                              className="btn-sm"
                              title="Switch into this user's view"
                              onClick={() => switchPersona(u)}
                            >
                              Test View
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  className="btn-sm"
                                  disabled={busy || isSelf}
                                  onClick={() => handleStatusToggle(u)}
                                >
                                  {u.status === 'active' ? 'Suspend' : 'Activate'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="btn-sm"
                                  style={{ color: '#f87171' }}
                                  disabled={busy || isSelf}
                                  onClick={() => setDeleteTarget(u)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Company & Session Settings */}
          <div className="detail-grid">
            <section className="card card-pad">
              <h2>Company Defaults</h2>
              <form className="stack" style={{ marginTop: 16 }} onSubmit={submitCompanySettings}>
                <Field label="Company name" error={nameError}>
                  <TextInput
                    value={values.name}
                    disabled={!isAdmin}
                    onChange={(e) => setValues({ ...values, name: e.target.value })}
                  />
                </Field>
                <Field label="Home terminal">
                  <TextInput
                    value={values.terminal}
                    disabled={!isAdmin}
                    onChange={(e) => setValues({ ...values, terminal: e.target.value })}
                  />
                </Field>
                <Field label="Timezone">
                  <Select
                    value={values.timezone}
                    disabled={!isAdmin}
                    onChange={(e) => setValues({ ...values, timezone: e.target.value })}
                  >
                    <option value="America/Chicago">America/Chicago (Central)</option>
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="America/Denver">America/Denver (Mountain)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                  </Select>
                </Field>
                <Field label="Unit system">
                  <Select
                    value={values.unitSystem}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        unitSystem: e.target.value as CompanySettings['unitSystem'],
                      })
                    }
                  >
                    <option value="imperial">Imperial (Miles, Gallons, Lbs)</option>
                    <option value="metric">Metric (Kilometers, Liters, Kg)</option>
                  </Select>
                </Field>
                <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={values.emailAlerts}
                    disabled={!isAdmin}
                    onChange={(e) => setValues({ ...values, emailAlerts: e.target.checked })}
                  />
                  Email alerts (mocked)
                </label>
                <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={values.smsAlerts}
                    disabled={!isAdmin}
                    onChange={(e) => setValues({ ...values, smsAlerts: e.target.checked })}
                  />
                  SMS alerts (mocked)
                </label>
                {isAdmin && (
                  <div>
                    <Button type="submit" disabled={busy}>
                      {busy ? 'Saving…' : 'Save Company Settings'}
                    </Button>
                  </div>
                )}
              </form>
            </section>

            <section className="card card-pad">
              <h2>Active Session & Diagnostics</h2>
              <dl className="kv" style={{ marginTop: 14 }}>
                <dt>Signed in as</dt>
                <dd>
                  <strong>{user?.name}</strong>
                </dd>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
                <dt>Assigned Role</dt>
                <dd>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      ...ROLE_COLORS[user?.role ?? 'fleet_manager'],
                    }}
                  >
                    {user ? ROLE_LABELS[user.role] : 'N/A'}
                  </span>
                </dd>
                <dt>Admin Elevation Rights</dt>
                <dd>{isAdmin ? '✅ Granted (Fleet Operations Manager)' : '❌ Restricted'}</dd>
              </dl>
              <p className="muted small" style={{ marginTop: 16 }}>
                Auth sessions, team members, and role elevation state persist in <code>localStorage</code>.
              </p>
              <Button variant="danger" style={{ marginTop: 16 }} onClick={() => setResetOpen(true)}>
                Restore Default Demo Fleet & Seed Users
              </Button>
            </section>
          </div>

          {/* Add Team Member Modal */}
          <Modal
            open={addModalOpen}
            title="Add Team Member / Sub-User"
            onClose={() => setAddModalOpen(false)}
          >
            <form className="stack" onSubmit={handleCreateUserSubmit}>
              <Field label="Full Name" error={newUserErrors.name}>
                <TextInput
                  placeholder="e.g. Rachel Adams"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </Field>
              <Field label="Job Title" error={newUserErrors.title}>
                <TextInput
                  placeholder="e.g. Regional Dispatcher"
                  value={newUserData.title}
                  onChange={(e) => setNewUserData({ ...newUserData, title: e.target.value })}
                />
              </Field>
              <Field label="Email Address" error={newUserErrors.email}>
                <TextInput
                  type="email"
                  placeholder="e.g. rachel@fleetlogistics.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </Field>
              <Field label="Phone Number (Optional)">
                <TextInput
                  placeholder="e.g. (214) 555-0145"
                  value={newUserData.phone || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                />
              </Field>
              <Field label="Role & Access Tier">
                <Select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                >
                  <option value="fleet_manager">👑 Fleet Operations Manager (Full Admin)</option>
                  <option value="dispatcher">🚚 Dispatcher (Trips, Loads, Routing)</option>
                  <option value="staff">📋 Operations Associate (Staff - Read & Write)</option>
                  <option value="safety_officer">🛡️ Safety & Compliance Officer</option>
                  <option value="mechanic">🔧 Maintenance Technician</option>
                  <option value="driver">🚛 Commercial Driver</option>
                </Select>
              </Field>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 0' }}>
                {ROLE_DESCRIPTIONS[newUserData.role]}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={busy}>
                  {busy ? 'Adding…' : 'Add Team Member'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete User Confirm Dialog */}
          <ConfirmDialog
            open={Boolean(deleteTarget)}
            title="Delete team member?"
            body={`Are you sure you want to delete ${deleteTarget?.name}? This will remove their local profile.`}
            confirmLabel="Delete User"
            busy={busy}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDeleteUserConfirm}
          />

          {/* Reset Demo Data Confirm Dialog */}
          <ConfirmDialog
            open={resetOpen}
            title="Restore seed data?"
            body="This will reset all vehicles, drivers, trips, loads, alerts, and team user accounts back to their original state."
            confirmLabel="Restore"
            busy={busy}
            onCancel={() => setResetOpen(false)}
            onConfirm={async () => {
              setBusy(true)
              try {
                await restoreDemoData()
                refreshSession()
                notify('success', 'Demo data & team users restored')
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
