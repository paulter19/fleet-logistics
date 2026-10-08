import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadFormModal } from '../components/EntityForms'
import { RateCalculatorModal } from '../components/RateCalculatorModal'
import { PageGate } from '../components/PageGate'
import { LoadStatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { Load, LoadPriority, LoadStatus } from '../types'
import { exportToCSV } from '../utils/csv'
import { formatMoney, formatNumber, labelize } from '../utils/format'

export function LoadsPage() {
  const { data, loading, error, createLoad, updateLoad } = useFleet()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LoadStatus | 'all'>('all')
  const [priority, setPriority] = useState<LoadPriority | 'all'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'revenue_desc' | 'weight_desc'>('default')
  const [open, setOpen] = useState(false)
  const [rateCalcOpen, setRateCalcOpen] = useState(false)
  const [editing, setEditing] = useState<Load | null>(null)
  const q = useDebouncedValue(query)
  const trips = (data?.trips ?? []).map((t) => ({ id: t.id, name: t.tripNumber }))

  const rows = useMemo(() => {
    if (!data) return []
    const filtered = data.loads.filter((load) => {
      const hay = `${load.loadNumber} ${load.customer} ${load.pickup} ${load.dropoff} ${load.commodity}`.toLowerCase()
      return (
        hay.includes(q.toLowerCase()) &&
        (status === 'all' || load.status === status) &&
        (priority === 'all' || load.priority === priority)
      )
    })

    if (sortBy === 'revenue_desc') {
      return [...filtered].sort((a, b) => b.revenue - a.revenue)
    }
    if (sortBy === 'weight_desc') {
      return [...filtered].sort((a, b) => b.weightLbs - a.weightLbs)
    }
    return filtered
  }, [data, q, status, priority, sortBy])

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV('freight_loads', rows, [
      { key: 'loadNumber', label: 'Load #' },
      { key: 'customer', label: 'Customer' },
      { key: 'pickup', label: 'Pickup Location' },
      { key: 'dropoff', label: 'Dropoff Location' },
      { key: 'commodity', label: 'Commodity' },
      { key: 'weightLbs', label: 'Weight (lbs)' },
      { key: 'pieces', label: 'Pieces' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'revenue', label: 'Revenue ($)' },
      { key: 'pickupWindow', label: 'Pickup Window' },
      { key: 'deliveryWindow', label: 'Delivery Window' },
    ])
    notify('info', 'Exported loads to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Loads</h1>
              <p>{data.loads.length} freight records · {formatMoney(data.loads.reduce((s, l) => s + l.revenue, 0))} booked</p>
            </div>
            <div className="header-actions">
              <Button variant="ghost" onClick={() => setRateCalcOpen(true)}>
                🧮 Rate Calculator
              </Button>
              <Button variant="ghost" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                Create load
              </Button>
            </div>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search customer, commodity, city…" onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as LoadStatus | 'all')}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In transit</option>
              <option value="delivered">Delivered</option>
              <option value="exception">Exception</option>
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as LoadPriority | 'all')}>
              <option value="all">All priorities</option>
              <option value="standard">Standard</option>
              <option value="expedited">Expedited</option>
              <option value="critical">Critical</option>
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="default">Default Sort</option>
              <option value="revenue_desc">Highest Revenue</option>
              <option value="weight_desc">Heaviest Weight</option>
            </Select>
          </div>
          <div className="card">
            {rows.length === 0 ? (
              <EmptyState
                title="No loads match"
                body="Adjust filters or add a load."
                action={
                  <Button variant="ghost" onClick={() => { setQuery(''); setStatus('all'); setPriority('all'); setSortBy('default') }}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Load</th>
                      <th>Lane</th>
                      <th>Cargo</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Revenue</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((load) => (
                      <tr key={load.id} className="row-link" onClick={() => navigate(`/loads/${load.id}`)}>
                        <td>
                          <div className="cell-strong">{load.loadNumber}</div>
                          <div className="small muted">{load.customer}</div>
                        </td>
                        <td>
                          {load.pickup} → {load.dropoff}
                        </td>
                        <td>
                          <div className="small">{load.commodity}</div>
                          <div className="small muted">{formatNumber(load.weightLbs)} lbs · {load.pieces} pcs</div>
                        </td>
                        <td>
                          <LoadStatusBadge value={load.status} />
                        </td>
                        <td>{labelize(load.priority)}</td>
                        <td>{formatMoney(load.revenue)}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditing(load)
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
          <LoadFormModal
            open={open}
            initial={editing}
            trips={trips}
            onClose={() => setOpen(false)}
            onSave={async (input) => {
              if (editing) {
                await updateLoad(editing.id, input)
                notify('success', 'Load updated')
              } else {
                await createLoad(input)
                notify('success', 'Load created')
              }
            }}
          />
          <RateCalculatorModal
            open={rateCalcOpen}
            onClose={() => setRateCalcOpen(false)}
          />
        </div>
      ) : null}
    </PageGate>
  )
}

