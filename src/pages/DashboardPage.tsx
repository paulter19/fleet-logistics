import { Link, useNavigate } from 'react-router-dom'
import { TripStatusBadge } from '../components/StatusBadge'
import { useFleet } from '../hooks/useFleet'
import { formatMoney, formatNumber, relativeTime } from '../utils/format'
import { LoadingBlock } from '../components/ui/Feedback'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useFleet()

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
        <div className="error-banner">{error ?? 'No data loaded.'}</div>
      </div>
    )
  }

  const activeUnits = data.vehicles.filter((v) => v.status === 'active').length
  const onTrip = data.drivers.filter((d) => d.status === 'on_trip').length
  const inTransit = data.loads.filter((l) => l.status === 'in_transit').length
  const overdue = data.maintenance.filter((m) => m.status === 'overdue').length
  const fuelSpend = data.fuelLogs.reduce((sum, log) => sum + log.gallons * log.pricePerGallon, 0)
  const liveTrips = data.trips.filter((t) => t.status === 'in_transit' || t.status === 'delayed')
  const unread = data.alerts.filter((a) => !a.read)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Operations board</h1>
          <p>Live view of {data.settings.name} — {data.settings.terminal}</p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-ghost" to="/dispatch">
            Open dispatch
          </Link>
          <Link className="btn btn-primary" to="/loads">
            Review loads
          </Link>
        </div>
      </div>

      <div className="stats">
        <article className="card stat">
          <label>Active vehicles</label>
          <strong>{activeUnits}</strong>
          <div className="delta up">{data.vehicles.length} in fleet</div>
        </article>
        <article className="card stat">
          <label>Drivers on trip</label>
          <strong>{onTrip}</strong>
          <div className="delta">{data.drivers.length} total drivers</div>
        </article>
        <article className="card stat">
          <label>Loads in transit</label>
          <strong>{inTransit}</strong>
          <div className="delta up">{formatMoney(data.loads.filter((l) => l.status !== 'delivered').reduce((s, l) => s + l.revenue, 0))} open revenue</div>
        </article>
        <article className="card stat">
          <label>Overdue maintenance</label>
          <strong>{overdue}</strong>
          <div className={`delta ${overdue ? 'down' : 'up'}`}>{overdue ? 'Needs shop attention' : 'All clear'}</div>
        </article>
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <div className="card-head">
            <h2>Live trips</h2>
            <Link to="/dispatch" className="small">
              View all
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Lane</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {liveTrips.map((trip) => (
                  <tr key={trip.id} className="row-link" onClick={() => navigate(`/dispatch/${trip.id}`)}>
                    <td className="cell-strong">{trip.tripNumber}</td>
                    <td>
                      {trip.origin} → {trip.destination}
                    </td>
                    <td>
                      <TripStatusBadge value={trip.status} />
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div className="progress">
                        <span style={{ width: `${trip.progress}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card card-pad">
          <div className="card-head">
            <h2>Attention</h2>
            <Link to="/alerts" className="small">
              Alerts
            </Link>
          </div>
          {unread.length === 0 ? (
            <p className="muted">No unread alerts.</p>
          ) : (
            unread.slice(0, 6).map((alert) => (
              <div className="list-item" key={alert.id}>
                <span className={`dot ${alert.severity}`} />
                <div>
                  <div className="cell-strong">{alert.title}</div>
                  <div className="small muted">{alert.message}</div>
                  <div className="small muted">{relativeTime(alert.createdAt)}</div>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: 16 }} className="muted small">
            Demo fuel spend (logged): {formatMoney(fuelSpend, true)} · {formatNumber(data.fuelLogs.length)} tickets
          </div>
        </section>
      </div>
    </div>
  )
}
