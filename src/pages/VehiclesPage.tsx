import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { VehicleFormModal } from '../components/EntityForms'
import { VehicleStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState, LoadingBlock } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { Vehicle, VehicleStatus } from '../types'
import { driverName, formatMiles, labelize } from '../utils/format'

export function VehiclesPage() {
  const { data, loading, error, createVehicle, updateVehicle, deleteVehicle } = useFleet()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState<VehicleStatus | 'all'>('all')
  const [type, setType] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)
  const [busy, setBusy] = useState(false)
  const q = useDebouncedValue(query)

  const drivers = (data?.drivers ?? []).map((d) => ({ id: d.id, name: driverName(d.firstName, d.lastName) }))

  const rows = useMemo(() => {
    if (!data) return []
    return data.vehicles.filter((vehicle) => {
      const hay = `${vehicle.unitNumber} ${vehicle.make} ${vehicle.model} ${vehicle.plate} ${vehicle.location}`.toLowerCase()
      const matchesQuery = hay.includes(q.toLowerCase())
      const matchesStatus = status === 'all' || vehicle.status === status
      const matchesType = type === 'all' || vehicle.type === type
      return matchesQuery && matchesStatus && matchesType
    })
  }, [data, q, status, type])

  if (loading && !data) {
    return (
      <div className="page">
        <LoadingBlock />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="page">
        <div className="error-banner">{error ?? 'Unable to load vehicles.'}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vehicles</h1>
          <p>{data.vehicles.length} units · filter, inspect, and keep assignments current</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          Add vehicle
        </Button>
      </div>
      <div className="toolbar">
        <div className="grow">
          <TextInput value={query} placeholder="Search unit, plate, city…" onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus | 'all')}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_service">Out of service</option>
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          <option value="tractor">Tractor</option>
          <option value="straight_truck">Straight truck</option>
          <option value="reefer">Reefer</option>
          <option value="van">Van</option>
        </Select>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <EmptyState
            title="No vehicles match"
            body="Try clearing filters or add a unit to the demo fleet."
            action={
              <Button variant="ghost" onClick={() => { setQuery(''); setStatus('all'); setType('all') }}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Mileage</th>
                  <th>Fuel</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((vehicle) => (
                  <tr key={vehicle.id} className="row-link" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                    <td>
                      <div className="cell-strong">{vehicle.unitNumber}</div>
                      <div className="small muted">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                    </td>
                    <td>{labelize(vehicle.type)}</td>
                    <td>
                      <VehicleStatusBadge value={vehicle.status} />
                    </td>
                    <td>{vehicle.location}</td>
                    <td>{formatMiles(vehicle.mileage)}</td>
                    <td>{vehicle.fuelLevel}%</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditing(vehicle)
                          setOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <VehicleFormModal
        open={open}
        initial={editing}
        drivers={drivers}
        onClose={() => setOpen(false)}
        onSave={async (input) => {
          if (editing) {
            await updateVehicle(editing.id, input)
            notify('success', 'Vehicle updated')
          } else {
            await createVehicle(input)
            notify('success', 'Vehicle added')
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove vehicle?"
        body="This only updates local demo data."
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          setBusy(true)
          try {
            await deleteVehicle(pendingDelete.id)
            notify('success', 'Vehicle removed')
            setPendingDelete(null)
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
