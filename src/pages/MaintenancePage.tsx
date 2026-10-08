import { useMemo, useState } from 'react'
import { MaintenanceFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { MaintenanceStatusBadge } from '../components/StatusBadge'
import { ConfirmDialog, EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { MaintenanceOrder, MaintenanceStatus } from '../types'
import { exportToCSV } from '../utils/csv'
import { formatDate, formatMoney, labelize } from '../utils/format'

export function MaintenancePage() {
  const { data, loading, error, createMaintenance, updateMaintenance, deleteMaintenance } = useFleet()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MaintenanceStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceOrder | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MaintenanceOrder | null>(null)
  const [busy, setBusy] = useState(false)
  const q = useDebouncedValue(query)
  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))

  const rows = useMemo(() => {
    if (!data) return []
    return data.maintenance.filter((order) => {
      const unit = data.vehicles.find((v) => v.id === order.vehicleId)?.unitNumber ?? ''
      const hay = `${order.workOrder} ${order.title} ${order.vendor} ${unit}`.toLowerCase()
      return hay.includes(q.toLowerCase()) && (status === 'all' || order.status === status)
    })
  }, [data, q, status])

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV('maintenance_work_orders', rows, [
      { key: 'workOrder', label: 'Work Order #' },
      {
        key: (o) => {
          const v = data.vehicles.find((veh) => veh.id === o.vehicleId)
          return v ? v.unitNumber : 'Unassigned'
        },
        label: 'Vehicle Unit',
      },
      { key: 'title', label: 'Title / Service' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'vendor', label: 'Vendor / Shop' },
      { key: 'scheduledAt', label: 'Scheduled Date' },
      { key: 'completedAt', label: 'Completed Date' },
      { key: 'cost', label: 'Cost ($)' },
      { key: 'notes', label: 'Notes' },
    ])
    notify('info', 'Exported maintenance records to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Maintenance</h1>
              <p>
                {formatMoney(data.maintenance.reduce((s, o) => s + o.cost, 0))} recorded shop cost ·{' '}
                {data.maintenance.filter((o) => o.status === 'overdue').length} overdue
              </p>
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
                New work order
              </Button>
            </div>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search WO, title, vendor, unit…" onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStatus | 'all')}>
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
          <div className="card">
            {rows.length === 0 ? (
              <EmptyState
                title="No work orders match"
                body="Open a new order or reset filters."
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
                      <th>WO</th>
                      <th>Vehicle</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Scheduled</th>
                      <th>Cost</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((order) => {
                      const unit = data.vehicles.find((v) => v.id === order.vehicleId)
                      return (
                        <tr key={order.id}>
                          <td className="cell-strong">{order.workOrder}</td>
                          <td>{unit?.unitNumber ?? '—'}</td>
                          <td>
                            <div>{order.title}</div>
                            <div className="small muted">{labelize(order.type)} · {order.vendor}</div>
                          </td>
                          <td>
                            <MaintenanceStatusBadge value={order.status} />
                          </td>
                          <td>{formatDate(order.scheduledAt)}</td>
                          <td>{formatMoney(order.cost, true)}</td>
                          <td>
                            <div className="header-actions">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditing(order)
                                  setOpen(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setPendingDelete(order)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <MaintenanceFormModal
            open={open}
            initial={editing}
            vehicles={vehicles}
            onClose={() => setOpen(false)}
            onSave={async (input) => {
              if (editing) {
                await updateMaintenance(editing.id, input)
                notify('success', 'Work order updated')
              } else {
                await createMaintenance(input)
                notify('success', 'Work order created')
              }
            }}
          />
          <ConfirmDialog
            open={Boolean(pendingDelete)}
            title="Delete work order?"
            body="Local demo data only."
            busy={busy}
            onCancel={() => setPendingDelete(null)}
            onConfirm={async () => {
              if (!pendingDelete) return
              setBusy(true)
              try {
                await deleteMaintenance(pendingDelete.id)
                notify('success', 'Work order deleted')
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
