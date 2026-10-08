import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DriverFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { DriverStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
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
                <h2>Profile</h2>
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
                <dt>HOS remaining</dt>
                <dd>{driver.hosHoursRemaining} hours</dd>
                <dt>Terminal</dt>
                <dd>{driver.homeTerminal}</dd>
                <dt>Vehicle</dt>
                <dd>
                  {vehicle ? <Link to={`/vehicles/${vehicle.id}`}>{vehicle.unitNumber}</Link> : 'Unassigned'}
                </dd>
              </dl>
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
