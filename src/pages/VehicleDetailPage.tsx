import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DVIRModal } from '../components/DVIRModal'
import { VehicleFormModal } from '../components/EntityForms'
import { VehicleStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState, LoadingBlock } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import { driverName, formatDate, formatDateTime, formatMiles, labelize } from '../utils/format'

export function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, updateVehicle, deleteVehicle, createDVIR } = useFleet()
  const { notify } = useToast()
  const [edit, setEdit] = useState(false)
  const [dvirOpen, setDvirOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const vehicle = data?.vehicles.find((item) => item.id === id)
  const driver = data?.drivers.find((item) => item.id === vehicle?.assignedDriverId)
  const trips = data?.trips.filter((item) => item.vehicleId === id) ?? []
  const work = data?.maintenance.filter((item) => item.vehicleId === id) ?? []
  const dvirs = (data?.dvirInspections ?? []).filter((item) => item.vehicleId === id)
  const drivers = (data?.drivers ?? []).map((d) => ({ id: d.id, name: driverName(d.firstName, d.lastName) }))

  if (loading && !data) {
    return (
      <div className="page">
        <LoadingBlock />
      </div>
    )
  }
  if (!vehicle) {
    return (
      <div className="page">
        <EmptyState title="Vehicle not found" body="It may have been removed from the demo data." action={<Link to="/vehicles">Back to vehicles</Link>} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="small muted">
            <Link to="/vehicles">Vehicles</Link> / {vehicle.unitNumber}
          </p>
          <h1>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p>
            {vehicle.plate} · VIN {vehicle.vin}
          </p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => setDvirOpen(true)}>
            📋 Log DVIR
          </Button>
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
            <h2>Unit profile</h2>
            <VehicleStatusBadge value={vehicle.status} />
          </div>
          <dl className="kv">
            <dt>Type</dt>
            <dd>{labelize(vehicle.type)}</dd>
            <dt>Location</dt>
            <dd>{vehicle.location}</dd>
            <dt>Mileage</dt>
            <dd>{formatMiles(vehicle.mileage)}</dd>
            <dt>Fuel</dt>
            <dd>
              <div className="progress" style={{ maxWidth: 180 }}>
                <span style={{ width: `${vehicle.fuelLevel}%` }} />
              </div>
              <span className="small muted"> {vehicle.fuelLevel}%</span>
            </dd>
            <dt>Driver</dt>
            <dd>
              {driver ? (
                <Link to={`/drivers/${driver.id}`}>{driverName(driver.firstName, driver.lastName)}</Link>
              ) : (
                'Unassigned'
              )}
            </dd>
            <dt>Last service</dt>
            <dd>{formatDate(vehicle.lastServiceAt)}</dd>
            <dt>Next PM</dt>
            <dd>{formatMiles(vehicle.nextServiceDueMiles)}</dd>
          </dl>
        </section>
        <section className="card card-pad">
          <h2>Recent trips</h2>
          {trips.length === 0 ? (
            <p className="muted small">No trips for this unit.</p>
          ) : (
            trips.slice(0, 6).map((trip) => (
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

      <div className="grid-2" style={{ marginTop: 14 }}>
        <section className="card card-pad">
          <div className="card-head">
            <h2>Safety & DVIR Inspections</h2>
            <Button size="sm" variant="ghost" onClick={() => setDvirOpen(true)}>
              + Inspect
            </Button>
          </div>
          {dvirs.length === 0 ? (
            <p className="muted small">No inspection reports recorded yet. Click "+ Inspect" to submit a pre-trip or post-trip safety checklist.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Signed By</th>
                  </tr>
                </thead>
                <tbody>
                  {dvirs.map((dvir) => (
                    <tr key={dvir.id}>
                      <td>{formatDateTime(dvir.inspectedAt)}</td>
                      <td>{labelize(dvir.type)}</td>
                      <td>
                        <span className={`tag ${dvir.status === 'passed' ? 'active' : 'out_of_service'}`}>
                          {dvir.status === 'passed' ? 'Passed' : `${dvir.defects.length} Defects`}
                        </span>
                      </td>
                      <td className="small">{dvir.signedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card card-pad">
          <h2>Maintenance history</h2>
          {work.length === 0 ? (
            <p className="muted small">No work orders.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>WO</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {work.map((order) => (
                    <tr key={order.id}>
                      <td>{order.workOrder}</td>
                      <td>{order.title}</td>
                      <td>{labelize(order.status)}</td>
                      <td>{order.vendor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <VehicleFormModal
        open={edit}
        initial={vehicle}
        drivers={drivers}
        onClose={() => setEdit(false)}
        onSave={async (input) => {
          await updateVehicle(vehicle.id, input)
          notify('success', 'Vehicle updated')
        }}
      />
      <DVIRModal
        open={dvirOpen}
        vehicleId={vehicle.id}
        unitNumber={vehicle.unitNumber}
        driverId={driver?.id ?? null}
        driverName={driver ? driverName(driver.firstName, driver.lastName) : ''}
        currentMileage={vehicle.mileage}
        onClose={() => setDvirOpen(false)}
        onSave={async (input) => {
          await createDVIR(input)
          notify('success', 'DVIR inspection report logged')
        }}
      />
      <ConfirmDialog
        open={confirm}
        title={`Delete ${vehicle.unitNumber}?`}
        body="This removes the unit from local demo data only."
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setBusy(true)
          try {
            await deleteVehicle(vehicle.id)
            notify('success', 'Vehicle deleted')
            navigate('/vehicles')
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}

