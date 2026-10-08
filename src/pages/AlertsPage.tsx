import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageGate } from '../components/PageGate'
import { EmptyState } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/Field'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import type { AlertSeverity } from '../types'
import { labelize, relativeTime } from '../utils/format'

export function AlertsPage() {
  const { data, loading, error, markAlertRead, markAllAlertsRead } = useFleet()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity | 'all'>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
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

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      {data ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h1>Alerts</h1>
              <p>{data.alerts.filter((a) => !a.read).length} unread across the demo workspace</p>
            </div>
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
