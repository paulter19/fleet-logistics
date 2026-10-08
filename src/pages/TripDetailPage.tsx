import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TripFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { TripStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import { driverName, formatDateTime, formatMiles } from '../utils/format'

export function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, updateTrip, deleteTrip } = useFleet()
  const { notify } = useToast()
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const trip = data?.trips.find((item) => item.id === id)
  const vehicle = data?.vehicles.find((item) => item.id === trip?.vehicleId)
  const driver = data?.drivers.find((item) => item.id === trip?.driverId)
  const load = data?.loads.find((item) => item.id === trip?.loadId)
  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))
  const drivers = (data?.drivers ?? []).map((d) => ({ id: d.id, name: driverName(d.firstName, d.lastName) }))
  const loads = (data?.loads ?? []).map((l) => ({ id: l.id, name: `${l.loadNumber} · ${l.customer}` }))

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {!trip ? (
        <div className="page">
          <EmptyState title="Trip not found" body="It may have been removed from demo data." action={<Link to="/dispatch">Back to dispatch</Link>} />
        </div>
      ) : (
        <div className="page">
          <div className="page-header">
            <div>
              <p className="small muted">
                <Link to="/dispatch">Dispatch</Link> / {trip.tripNumber}
              </p>
              <h1>
                {trip.origin} → {trip.destination}
              </h1>
              <p>{formatMiles(trip.miles)} · {trip.progress}% complete</p>
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
                <h2>Trip plan</h2>
                <TripStatusBadge value={trip.status} />
              </div>
              <dl className="kv">
                <dt>Start</dt>
                <dd>{formatDateTime(trip.scheduledStart)}</dd>
                <dt>ETA</dt>
                <dd>{formatDateTime(trip.eta)}</dd>
                <dt>Vehicle</dt>
                <dd>
                  {vehicle ? <Link to={`/vehicles/${vehicle.id}`}>{vehicle.unitNumber}</Link> : 'Unassigned'}
                </dd>
                <dt>Driver</dt>
                <dd>
                  {driver ? (
                    <Link to={`/drivers/${driver.id}`}>{driverName(driver.firstName, driver.lastName)}</Link>
                  ) : (
                    'Unassigned'
                  )}
                </dd>
                <dt>Load</dt>
                <dd>
                  {load ? <Link to={`/loads/${load.id}`}>{load.loadNumber}</Link> : 'None'}
                </dd>
                <dt>Notes</dt>
                <dd>{trip.notes || '—'}</dd>
              </dl>
              <div className="progress" style={{ marginTop: 16 }}>
                <span style={{ width: `${trip.progress}%` }} />
              </div>
            </section>
            <section className="card card-pad">
              <h2>Quick actions</h2>
              <div className="stack" style={{ marginTop: 12 }}>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await updateTrip(trip.id, { ...trip, status: 'in_transit', progress: Math.max(trip.progress, 10) })
                    notify('success', 'Marked in transit')
                  }}
                >
                  Mark in transit
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await updateTrip(trip.id, { ...trip, status: 'delayed' })
                    notify('info', 'Marked delayed')
                  }}
                >
                  Flag delay
                </Button>
                <Button
                  onClick={async () => {
                    await updateTrip(trip.id, { ...trip, status: 'completed', progress: 100 })
                    notify('success', 'Trip completed')
                  }}
                >
                  Complete trip
                </Button>
              </div>
            </section>
          </div>
          <TripFormModal
            open={edit}
            initial={trip}
            vehicles={vehicles}
            drivers={drivers}
            loads={loads}
            onClose={() => setEdit(false)}
            onSave={async (input) => {
              await updateTrip(trip.id, input)
              notify('success', 'Trip updated')
            }}
          />
          <ConfirmDialog
            open={confirm}
            title={`Delete ${trip.tripNumber}?`}
            body="Local demo data only."
            busy={busy}
            onCancel={() => setConfirm(false)}
            onConfirm={async () => {
              setBusy(true)
              try {
                await deleteTrip(trip.id)
                notify('success', 'Trip deleted')
                navigate('/dispatch')
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
