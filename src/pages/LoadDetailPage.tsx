import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { LoadStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import { formatMoney, formatNumber, labelize } from '../utils/format'

export function LoadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, updateLoad, deleteLoad } = useFleet()
  const { notify } = useToast()
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = data?.loads.find((item) => item.id === id)
  const trip = data?.trips.find((item) => item.id === load?.assignedTripId)
  const trips = (data?.trips ?? []).map((t) => ({ id: t.id, name: t.tripNumber }))

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {!load ? (
        <div className="page">
          <EmptyState title="Load not found" body="It may have been removed." action={<Link to="/loads">Back to loads</Link>} />
        </div>
      ) : (
        <div className="page">
          <div className="page-header">
            <div>
              <p className="small muted">
                <Link to="/loads">Loads</Link> / {load.loadNumber}
              </p>
              <h1>{load.customer}</h1>
              <p>
                {load.commodity} · {formatNumber(load.weightLbs)} lbs · {load.pieces} pcs
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
                <h2>Shipment</h2>
                <LoadStatusBadge value={load.status} />
              </div>
              <dl className="kv">
                <dt>Pickup</dt>
                <dd>{load.pickup}</dd>
                <dt>Dropoff</dt>
                <dd>{load.dropoff}</dd>
                <dt>Pickup window</dt>
                <dd>{load.pickupWindow || '—'}</dd>
                <dt>Delivery window</dt>
                <dd>{load.deliveryWindow || '—'}</dd>
                <dt>Priority</dt>
                <dd>{labelize(load.priority)}</dd>
                <dt>Revenue</dt>
                <dd>{formatMoney(load.revenue)}</dd>
                <dt>Trip</dt>
                <dd>
                  {trip ? <Link to={`/dispatch/${trip.id}`}>{trip.tripNumber}</Link> : 'Unassigned'}
                </dd>
              </dl>
            </section>
            <section className="card card-pad">
              <h2>Status</h2>
              <div className="stack" style={{ marginTop: 12 }}>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await updateLoad(load.id, { ...load, status: 'in_transit' })
                    notify('success', 'Load in transit')
                  }}
                >
                  Mark in transit
                </Button>
                <Button
                  onClick={async () => {
                    await updateLoad(load.id, { ...load, status: 'delivered' })
                    notify('success', 'Marked delivered')
                  }}
                >
                  Mark delivered
                </Button>
              </div>
            </section>
          </div>
          <LoadFormModal
            open={edit}
            initial={load}
            trips={trips}
            onClose={() => setEdit(false)}
            onSave={async (input) => {
              await updateLoad(load.id, input)
              notify('success', 'Load updated')
            }}
          />
          <ConfirmDialog
            open={confirm}
            title={`Delete ${load.loadNumber}?`}
            body="Local demo data only."
            busy={busy}
            onCancel={() => setConfirm(false)}
            onConfirm={async () => {
              setBusy(true)
              try {
                await deleteLoad(load.id)
                notify('success', 'Load deleted')
                navigate('/loads')
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
