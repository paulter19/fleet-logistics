import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DriverFormModal } from '../components/EntityForms'
import { PageGate } from '../components/PageGate'
import { DriverStatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { Driver, DriverStatus } from '../types'
import { exportToCSV } from '../utils/csv'
import { driverName, formatDate } from '../utils/format'

export function DriversPage() {
  const { data, loading, error, createDriver, updateDriver } = useFleet()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<DriverStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const q = useDebouncedValue(query)
  const vehicles = (data?.vehicles ?? []).map((v) => ({ id: v.id, name: v.unitNumber }))

  const rows = useMemo(() => {
    if (!data) return []
    return data.drivers.filter((driver) => {
      const hay = `${driver.firstName} ${driver.lastName} ${driver.email} ${driver.homeTerminal} ${driver.licenseNumber}`.toLowerCase()
      return hay.includes(q.toLowerCase()) && (status === 'all' || driver.status === status)
    })
  }, [data, q, status])

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV('fleet_drivers', rows, [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'licenseClass', label: 'License Class' },
      { key: 'licenseNumber', label: 'License #' },
      { key: 'licenseExpiresAt', label: 'License Expiration' },
      { key: 'hireDate', label: 'Hire Date' },
      { key: 'hosHoursRemaining', label: 'HOS Remaining (Hours)' },
      { key: 'homeTerminal', label: 'Home Terminal' },
    ])
    notify('info', 'Exported drivers to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Drivers</h1>
              <p>{data.drivers.length} drivers · HOS and assignment at a glance</p>
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
                Add driver
              </Button>
            </div>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search name, email, terminal…" onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as DriverStatus | 'all')}>
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On trip</option>
              <option value="off_duty">Off duty</option>
              <option value="on_leave">On leave</option>
            </Select>
          </div>
          <div className="card">
            {rows.length === 0 ? (
              <EmptyState
                title="No drivers match"
                body="Clear filters or add a driver to the demo roster."
                action={
                  <Button variant="ghost" onClick={() => { setQuery(''); setStatus('all') }}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>License</th>
                      <th>HOS left</th>
                      <th>Terminal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((driver) => (
                      <tr key={driver.id} className="row-link" onClick={() => navigate(`/drivers/${driver.id}`)}>
                        <td>
                          <div className="cell-strong">{driverName(driver.firstName, driver.lastName)}</div>
                          <div className="small muted">{driver.email}</div>
                        </td>
                        <td>
                          <DriverStatusBadge value={driver.status} />
                        </td>
                        <td>
                          {driver.licenseClass} · exp {formatDate(driver.licenseExpiresAt)}
                        </td>
                        <td>{driver.hosHoursRemaining}h</td>
                        <td>{driver.homeTerminal}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditing(driver)
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
          <DriverFormModal
            open={open}
            initial={editing}
            vehicles={vehicles}
            onClose={() => setOpen(false)}
            onSave={async (input) => {
              if (editing) {
                await updateDriver(editing.id, input)
                notify('success', 'Driver updated')
              } else {
                await createDriver(input)
                notify('success', 'Driver added')
              }
            }}
          />
        </div>
      ) : null}
    </PageGate>
  )
}
