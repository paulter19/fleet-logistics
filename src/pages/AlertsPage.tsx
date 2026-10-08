import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageGate } from '../components/PageGate'
import { EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { AlertSeverity, AlertType } from '../types'
import { exportToCSV } from '../utils/csv'
import { labelize, relativeTime } from '../utils/format'

export function AlertsPage() {
  const { data, loading, error, markAlertRead, markAllAlertsRead, createAlert } = useFleet()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity | 'all'>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const q = useDebouncedValue(query)

  const rows = useMemo(() => {
    if (!data) return []
    return data.alerts.filter((alert) => {
      const hay = `${alert.title} ${alert.message} ${alert.type}`.toLowerCase()
      return (
        hay.includes(q.toLowerCase()) &&
        (severity === 'all' || alert.severity === severity) &&
        (!unreadOnly || !alert.read)
      )
    })
  }, [data, q, severity, unreadOnly])

  const handleSimulateAlert = async (type: AlertType, sev: AlertSeverity, title: string, message: string) => {
    if (!data) return
    const randomVeh = data.vehicles[Math.floor(Math.random() * data.vehicles.length)]
    const randomDrv = data.drivers[Math.floor(Math.random() * data.drivers.length)]
    const randomTrp = data.trips[0]

    await createAlert({
      type,
      severity: sev,
      title,
      message,
      relatedVehicleId: randomVeh ? randomVeh.id : null,
      relatedDriverId: randomDrv ? randomDrv.id : null,
      relatedTripId: randomTrp ? randomTrp.id : null,
    })
    notify(sev === 'critical' ? 'error' : sev === 'warning' ? 'info' : 'success', `Simulated Alert: ${title}`)
    setSimOpen(false)
  }

  const handleExportCSV = () => {
    if (!data) return
    exportToCSV('fleet_alerts', rows, [
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'severity', label: 'Severity' },
      { key: 'type', label: 'Type' },
      { key: 'title', label: 'Title' },
      { key: 'message', label: 'Message' },
      { key: (a) => (a.read ? 'Read' : 'Unread'), label: 'Status' },
    ])
    notify('info', 'Exported alerts to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Alerts & Incident Center</h1>
              <p>{data.alerts.filter((a) => !a.read).length} unread across the demo workspace</p>
            </div>
            <div className="header-actions">
              <div style={{ position: 'relative' }}>
                <Button variant="ghost" onClick={() => setSimOpen((v) => !v)}>
                  ⚡ Simulate Incident ▾
                </Button>
                {simOpen && (
                  <div
                    className="card card-pad"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: 6,
                      zIndex: 20,
                      width: 280,
                      boxShadow: 'var(--shadow-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <span className="small muted font-medium">Trigger Simulated Event:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => handleSimulateAlert('fuel', 'warning', 'Low Fuel Warning (<12%)', 'Unit reported fuel level dropped below critical 12% reserve on I-35.')}
                    >
                      ⛽ Low Fuel Alert
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => handleSimulateAlert('hos', 'critical', 'HOS 30-Min Rest Violation', 'Driver has exceeded 8 continuous driving hours without mandatory 30m break.')}
                    >
                      ⏱️ HOS Rest Break Breach
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => handleSimulateAlert('maintenance', 'critical', 'Engine Fault SPN 111 FMI 1', 'Coolant level sensor tripped critical engine protection shutdown.')}
                    >
                      ⚠️ Diagnostic Fault Code
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => handleSimulateAlert('geofence', 'warning', 'Geofence Boundary Departure', 'Asset departed Dallas Distribution Center terminal outside scheduled window.')}
                    >
                      📍 Geofence Exit
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="ghost" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await markAllAlertsRead()
                  notify('success', 'All alerts marked read')
                }}
              >
                Mark all read
              </Button>
            </div>
          </div>
          <div className="toolbar">
            <div className="grow">
              <TextInput value={query} placeholder="Search alerts…" onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'all')}>
              <option value="all">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </Select>
            <Button variant={unreadOnly ? 'primary' : 'ghost'} onClick={() => setUnreadOnly((v) => !v)}>
              Unread only
            </Button>
          </div>
          <div className="card card-pad">
            {rows.length === 0 ? (
              <EmptyState title="No alerts" body="Nothing matches these filters." />
            ) : (
              rows.map((alert) => (
                <div className="list-item" key={alert.id} style={{ opacity: alert.read ? 0.7 : 1 }}>
                  <span className={`dot ${alert.severity}`} />
                  <div style={{ flex: 1 }}>
                    <div className="cell-strong">{alert.title}</div>
                    <div className="small muted">{alert.message}</div>
                    <div className="small muted">
                      {labelize(alert.type)} · {relativeTime(alert.createdAt)}
                      {alert.relatedVehicleId ? (
                        <>
                          {' '}
                          · <Link to={`/vehicles/${alert.relatedVehicleId}`}>Vehicle</Link>
                        </>
                      ) : null}
                      {alert.relatedDriverId ? (
                        <>
                          {' '}
                          · <Link to={`/drivers/${alert.relatedDriverId}`}>Driver</Link>
                        </>
                      ) : null}
                      {alert.relatedTripId ? (
                        <>
                          {' '}
                          · <Link to={`/dispatch/${alert.relatedTripId}`}>Trip</Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAlertRead(alert.id, !alert.read)}
                  >
                    {alert.read ? 'Mark unread' : 'Mark read'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </PageGate>
  )
}

