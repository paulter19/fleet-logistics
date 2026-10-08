import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TripFormModal } from '../components/EntityForms'
import { FleetMap } from '../components/FleetMap'
import { PageGate } from '../components/PageGate'
import { TripStatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { Trip, TripStatus } from '../types'
import { exportToCSV } from '../utils/csv'
import { driverName, formatDateTime, formatMiles } from '../utils/format'

const columns: TripStatus[] = ['scheduled', 'in_transit', 'delayed', 'completed', 'cancelled']

export function DispatchPage() {
  const { data, loading, error, createTrip, updateTrip } = useFleet()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TripStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'map'>('board')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Trip | null>(null)
  const q = useDebouncedValue(query)

  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))
  const drivers = (data?.drivers ?? []).map((d) => ({ id: d.id, name: driverName(d.firstName, d.lastName) }))
  const loads = (data?.loads ?? []).map((l) => ({ id: l.id, name: `${l.loadNumber} · ${l.customer}` }))

  const rows = useMemo(() => {
    if (!data) return []
    return data.trips.filter((trip) => {
      const hay = `${trip.tripNumber} ${trip.origin} ${trip.destination}`.toLowerCase()
      return hay.includes(q.toLowerCase()) && (status === 'all' || trip.status === status)
    })
  }, [data, q, status])

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV('trips_dispatch', rows, [
      { key: 'tripNumber', label: 'Trip #' },
      { key: 'origin', label: 'Origin' },
      { key: 'destination', label: 'Destination' },
      { key: 'status', label: 'Status' },
      { key: 'scheduledStart', label: 'Scheduled Start' },
      { key: 'eta', label: 'ETA' },
      { key: 'miles', label: 'Miles' },
      { key: 'progress', label: 'Progress (%)' },
      {
        key: (t) => {
          const veh = data.vehicles.find((v) => v.id === t.vehicleId)
          return veh ? veh.unitNumber : 'Unassigned'
        },
        label: 'Vehicle Unit',
      },
      {
        key: (t) => {
          const drv = data.drivers.find((d) => d.id === t.driverId)
          return drv ? `${drv.firstName} ${drv.lastName}` : 'Unassigned'
        },
        label: 'Driver',
      },
    ])
    notify('info', 'Exported trips to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Dispatch</h1>
              <p>Assign trips, watch lanes, and keep loads moving</p>
            </div>
            <div className="header-actions">
              <Button variant="ghost" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                Create trip
              </Button>
            </div>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search trip, origin, destination…" onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TripStatus | 'all')}>
              <option value="all">All statuses</option>
              {columns.map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </Select>
            <div className="map-filter-group" style={{ marginLeft: 6 }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'board' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('board')}
              >
                Board
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('map')}
              >
                🗺️ Live Map
              </button>
            </div>
          </div>

          {viewMode === 'map' && (
            <div style={{ marginTop: 14 }}>
              <FleetMap vehicles={data.vehicles} trips={data.trips} drivers={data.drivers} />
            </div>
          )}

          {viewMode === 'board' && (
            <div className="board">
              {columns.map((column) => {
                const items = rows.filter((trip) => trip.status === column)
                return (
                  <section className="board-col" key={column}>
                    <div className="card-head">
                      <h2>{column.replaceAll('_', ' ')}</h2>
                      <span className="small muted">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="muted small">None</p>
                    ) : (
                      items.map((trip) => (
                        <button key={trip.id} className="board-card" onClick={() => navigate(`/dispatch/${trip.id}`)}>
                          <div className="cell-strong">{trip.tripNumber}</div>
                          <div className="small muted">
                            {trip.origin} → {trip.destination}
                          </div>
                          <div className="small muted" style={{ marginTop: 4 }}>
                            {formatMiles(trip.miles)}
                          </div>
                          <div className="progress" style={{ marginTop: 8 }}>
                            <span style={{ width: `${trip.progress}%` }} />
                          </div>
                        </button>
                      ))
                    )}
                  </section>
                )
              })}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="card" style={{ marginTop: 8 }}>
              {rows.length === 0 ? (
                <EmptyState
                  title="No trips match"
                  body="Create a trip or clear filters."
                  action={
                    <Button variant="ghost" onClick={() => { setQuery(''); setStatus('all') }}>
                      Reset
                    </Button>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Trip</th>
                        <th>Lane</th>
                        <th>Status</th>
                        <th>Miles</th>
                        <th>ETA</th>
                        <th>Progress</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((trip) => (
                        <tr key={trip.id} className="row-link" onClick={() => navigate(`/dispatch/${trip.id}`)}>
                          <td className="cell-strong">{trip.tripNumber}</td>
                          <td>
                            {trip.origin} → {trip.destination}
                          </td>
                          <td>
                            <TripStatusBadge value={trip.status} />
                          </td>
                          <td>{formatMiles(trip.miles)}</td>
                          <td>{formatDateTime(trip.eta)}</td>
                          <td style={{ minWidth: 100 }}>
                            <div className="progress">
                              <span style={{ width: `${trip.progress}%` }} />
                            </div>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEditing(trip)
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
          )}

          <TripFormModal
            open={open}
            initial={editing}
            vehicles={vehicles}
            drivers={drivers}
            loads={loads}
            onClose={() => setOpen(false)}
            onSave={async (input) => {
              if (editing) {
                await updateTrip(editing.id, input)
                notify('success', 'Trip updated')
              } else {
                await createTrip(input)
                notify('success', 'Trip created')
              }
            }}
          />
        </div>
      ) : null}
    </PageGate>
  )
}

