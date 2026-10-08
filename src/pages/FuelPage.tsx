import { useMemo, useState } from 'react'
import { FuelFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { FuelLog } from '../types'
import { exportToCSV } from '../utils/csv'
import { driverName, formatDateTime, formatMoney, formatNumber } from '../utils/format'

export function FuelPage() {
  const { data, loading, error, createFuelLog, deleteFuelLog } = useFleet()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<FuelLog | null>(null)
  const [busy, setBusy] = useState(false)
  const q = useDebouncedValue(query)
  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))
  const drivers = (data?.drivers ?? []).map((d) => ({ id: d.id, name: driverName(d.firstName, d.lastName) }))

  const rows = useMemo(() => {
    if (!data) return []
    return data.fuelLogs.filter((log) => {
      const unit = data.vehicles.find((v) => v.id === log.vehicleId)?.unitNumber ?? ''
      const hay = `${unit} ${log.station} ${log.location}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
  }, [data, q])

  const spend = data?.fuelLogs.reduce((sum, log) => sum + log.gallons * log.pricePerGallon, 0) ?? 0
  const gallons = data?.fuelLogs.reduce((sum, log) => sum + log.gallons, 0) ?? 0

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV<FuelLog>('fuel_receipts', rows, [
      { key: 'filledAt', label: 'Date / Time' },
      {
        key: (l) => {
          const v = data.vehicles.find((veh) => veh.id === l.vehicleId)
          return v ? v.unitNumber : 'Unassigned'
        },
        label: 'Vehicle Unit',
      },
      {
        key: (l) => {
          const d = data.drivers.find((drv) => drv.id === l.driverId)
          return d ? `${d.firstName} ${d.lastName}` : 'Unassigned'
        },
        label: 'Driver',
      },
      { key: 'station', label: 'Fuel Station / Brand' },
      { key: 'location', label: 'Location' },
      { key: 'gallons', label: 'Gallons' },
      { key: 'pricePerGallon', label: 'Price Per Gallon ($)' },
      { key: (l) => (l.gallons * l.pricePerGallon).toFixed(2), label: 'Total Cost ($)' },
      { key: 'odometer', label: 'Odometer (Miles)' },
    ])
    notify('info', 'Exported fuel tickets to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Fuel</h1>
              <p>
                {formatNumber(gallons)} gal logged · {formatMoney(spend, true)} spend
              </p>
            </div>
            <div className="header-actions">
              <Button variant="ghost" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button onClick={() => setOpen(true)}>Log fuel</Button>
            </div>
          </div>
          <div className="stats">
            <article className="card stat">
              <label>Tickets</label>
              <strong>{data.fuelLogs.length}</strong>
            </article>
            <article className="card stat">
              <label>Gallons</label>
              <strong>{formatNumber(Math.round(gallons))}</strong>
            </article>
            <article className="card stat">
              <label>Spend</label>
              <strong>{formatMoney(spend)}</strong>
            </article>
            <article className="card stat">
              <label>Avg $/gal</label>
              <strong>{gallons ? formatMoney(spend / gallons, true) : '—'}</strong>
            </article>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search unit, station, city…" onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="card">
            {rows.length === 0 ? (
              <EmptyState title="No fuel tickets" body="Log a purchase to populate the demo ledger." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Unit</th>
                      <th>Station</th>
                      <th>Gallons</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((log) => {
                      const unit = data.vehicles.find((v) => v.id === log.vehicleId)
                      return (
                        <tr key={log.id}>
                          <td>{formatDateTime(log.filledAt)}</td>
                          <td className="cell-strong">{unit?.unitNumber ?? '—'}</td>
                          <td>
                            <div>{log.station || '—'}</div>
                            <div className="small muted">{log.location}</div>
                          </td>
                          <td>{log.gallons}</td>
                          <td>{formatMoney(log.gallons * log.pricePerGallon, true)}</td>
                          <td>
                            <Button size="sm" variant="danger" onClick={() => setPendingDelete(log)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <FuelFormModal
            open={open}
            vehicles={vehicles}
            drivers={drivers}
            onClose={() => setOpen(false)}
            onSave={async (input) => {
              await createFuelLog(input)
              notify('success', 'Fuel ticket saved')
            }}
          />
          <ConfirmDialog
            open={Boolean(pendingDelete)}
            title="Delete fuel ticket?"
            body="Local demo data only."
            busy={busy}
            onCancel={() => setPendingDelete(null)}
            onConfirm={async () => {
              if (!pendingDelete) return
              setBusy(true)
              try {
                await deleteFuelLog(pendingDelete.id)
                notify('success', 'Ticket deleted')
                setPendingDelete(null)
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
