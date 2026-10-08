import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DriverFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { DriverStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { DriverStatus } from '../types'
import { driverName, formatDate } from '../utils/format'

export function DriverDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, updateDriver, deleteDriver } = useFleet()
  const { notify } = useToast()
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const driver = data?.drivers.find((item) => item.id === id)
  const vehicle = data?.vehicles.find((item) => item.id === driver?.assignedVehicleId)
  const trips = data?.trips.filter((item) => item.driverId === id) ?? []
  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))

  const handleStatusChange = async (newStatus: DriverStatus, hosAdjustment: number) => {
    if (!driver) return
    const nextHos = Math.max(0, Math.min(11, driver.hosHoursRemaining + hosAdjustment))
    await updateDriver(driver.id, {
      ...driver,
      status: newStatus,
      hosHoursRemaining: nextHos,
    })
    notify('success', `Driver status updated to ${newStatus.replace('_', ' ')}`)
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {!driver ? (
        <div className="page">
          <EmptyState title="Driver not found" body="They may have been removed from the roster." action={<Link to="/drivers">Back to drivers</Link>} />
        </div>
      ) : (
        <div className="page">
          <div className="page-header">
            <div>
              <p className="small muted">
                <Link to="/drivers">Drivers</Link> / {driverName(driver.firstName, driver.lastName)}
              </p>
              <h1>{driverName(driver.firstName, driver.lastName)}</h1>
              <p>
                {driver.email} · hired {formatDate(driver.hireDate)}
              </p>
            </div>
            <div className="header-actions">
              <Button variant="ghost" onClick={() => setEdit(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Delete
              </Button>
            </div>
          </div>
          <div className="detail-grid">
            <section className="card card-pad">
              <div className="card-head">
                <h2>Profile & Compliance</h2>
                <DriverStatusBadge value={driver.status} />
              </div>
              <dl className="kv">
                <dt>Phone</dt>
                <dd>{driver.phone || '—'}</dd>
                <dt>Email</dt>
                <dd>{driver.email}</dd>
                <dt>License</dt>
                <dd>
                  {driver.licenseClass} {driver.licenseNumber}
                </dd>
                <dt>Expires</dt>
                <dd>{formatDate(driver.licenseExpiresAt)}</dd>
                <dt>HOS Remaining</dt>
                <dd className="cell-strong" style={{ color: driver.hosHoursRemaining < 2 ? 'var(--danger)' : 'var(--success)' }}>
                  {driver.hosHoursRemaining} hours (FMCSA 11h Rule)
                </dd>
                <dt>Home Terminal</dt>
                <dd>{driver.homeTerminal}</dd>
                <dt>Assigned Vehicle</dt>
                <dd>
                  {vehicle ? <Link to={`/vehicles/${vehicle.id}`}>{vehicle.unitNumber}</Link> : 'Unassigned'}
                </dd>
              </dl>

              {/* Duty Status Actions */}
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <span className="small muted" style={{ display: 'block', marginBottom: 8 }}>
                  Change Duty Status:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant={driver.status === 'on_trip' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('on_trip', -1)}
                  >
                    🚛 Driving
                  </Button>
                  <Button
                    size="sm"
                    variant={driver.status === 'available' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('available', 0)}
                  >
                    ⏱️ On Duty
                  </Button>
                  <Button
                    size="sm"
                    variant={driver.status === 'off_duty' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('off_duty', 2)}
                  >
                    🏠 Off Duty
                  </Button>
                  <Button
                    size="sm"
                    variant={driver.status === 'on_leave' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('on_leave', 10)}
                  >
                    🛌 Reset (10h Break)
                  </Button>
                </div>
              </div>
            </section>

            <section className="card card-pad">
              <h2>Recent trips</h2>
              {trips.length === 0 ? (
                <p className="muted small">No assigned trips.</p>
              ) : (
                trips.slice(0, 8).map((trip) => (
                  <div className="list-item" key={trip.id}>
                    <div>
                      <Link to={`/dispatch/${trip.id}`} className="cell-strong">
                        {trip.tripNumber}
                      </Link>
                      <div className="small muted">
                        {trip.origin} → {trip.destination}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* 24-Hour HOS Electronic Log Sheet */}
          <section className="card card-pad" style={{ marginTop: 16 }}>
            <div className="card-head">
              <div>
                <h2>Electronic Driver Log (ELD 24-Hour Grid)</h2>
                <span className="small muted">Standard DOT 49 CFR Part 395 Hours of Service record</span>
              </div>
              <span className={`tag ${driver.hosHoursRemaining > 2 ? 'active' : 'out_of_service'}`}>
                {driver.hosHoursRemaining}h drive time remaining
              </span>
            </div>

            <div className="hos-timeline-wrap">
              <div className="hos-grid">
                {/* 1. OFF DUTY */}
                <div className="hos-row">
                  <span className="hos-label">1. OFF</span>
                  <div className="hos-blocks">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <span
                        key={hour}
                        className={`hos-block ${hour < 6 || (hour >= 20 && driver.status === 'off_duty') ? 'active-offduty' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                {/* 2. SLEEPER BERTH */}
                <div className="hos-row">
                  <span className="hos-label">2. SB</span>
                  <div className="hos-blocks">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <span
                        key={hour}
                        className={`hos-block ${hour >= 1 && hour < 5 ? 'active-sleeper' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                {/* 3. DRIVING */}
                <div className="hos-row">
                  <span className="hos-label">3. D</span>
                  <div className="hos-blocks">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <span
                        key={hour}
                        className={`hos-block ${(hour >= 8 && hour < 14) || (driver.status === 'on_trip' && hour >= 14 && hour < 14 + (11 - driver.hosHoursRemaining)) ? 'active-drive' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                {/* 4. ON DUTY (NOT DRIVING) */}
                <div className="hos-row">
                  <span className="hos-label">4. ON</span>
                  <div className="hos-blocks">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <span
                        key={hour}
                        className={`hos-block ${hour === 6 || hour === 7 || hour === 14 ? 'active-onduty' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hours of Day Axis */}
              <div className="hos-hours-axis">
                <span></span>
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i}>{i}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span><span className="dot" style={{ background: '#64748b' }} /> Off Duty: 8.0 hrs</span>
              <span><span className="dot" style={{ background: '#6366f1' }} /> Sleeper: 4.0 hrs</span>
              <span><span className="dot" style={{ background: '#10b981' }} /> Driving: {11 - driver.hosHoursRemaining} hrs</span>
              <span><span className="dot" style={{ background: '#f59e0b' }} /> On-Duty: 3.0 hrs</span>
            </div>
          </section>

          <DriverFormModal
            open={edit}
            initial={driver}
            vehicles={vehicles}
            onClose={() => setEdit(false)}
            onSave={async (input) => {
              await updateDriver(driver.id, input)
              notify('success', 'Driver updated')
            }}
          />
          <ConfirmDialog
            open={confirm}
            title={`Remove ${driver.firstName}?`}
            body="Local demo data only."
            busy={busy}
            onCancel={() => setConfirm(false)}
            onConfirm={async () => {
              setBusy(true)
              try {
                await deleteDriver(driver.id)
                notify('success', 'Driver removed')
                navigate('/drivers')
              } finally {
                setBusy(false)
              }
            }}
          />
        </div>
      )}
    </PageGate>
  )
}

