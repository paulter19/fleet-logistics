import { PageGate } from '../components/PageGate'
import { useFleet } from '../hooks/useFleet'
import { formatMoney, formatNumber, labelize } from '../utils/format'

export function ReportsPage() {
  const { data, loading, error } = useFleet()

  if (!data) {
    return (
      <PageGate loading={loading} error={error} ready={false}>
        {null}
      </PageGate>
    )
  }

  const revenue = data.loads.reduce((s, l) => s + l.revenue, 0)
  const openRevenue = data.loads.filter((l) => l.status !== 'delivered').reduce((s, l) => s + l.revenue, 0)
  const fuelSpend = data.fuelLogs.reduce((s, l) => s + l.gallons * l.pricePerGallon, 0)
  const shop = data.maintenance.reduce((s, o) => s + o.cost, 0)
  const miles = data.trips.reduce((s, t) => s + t.miles, 0)
  const completed = data.trips.filter((t) => t.status === 'completed').length
  const delayed = data.trips.filter((t) => t.status === 'delayed').length
  const customers = Object.entries(
    data.loads.reduce<Record<string, number>>((acc, load) => {
      acc[load.customer] = (acc[load.customer] ?? 0) + load.revenue
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const vehicleTotal = Math.max(data.vehicles.length, 1)
  const statusCounts = ['active', 'idle', 'maintenance', 'out_of_service'].map((status) => ({
    status,
    count: data.vehicles.filter((v) => v.status === status).length,
  }))

  return (
    <PageGate loading={loading} error={error} ready>
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Reports</h1>
            <p>Local rollups from demo fleet data — replace with warehouse queries later</p>
          </div>
        </div>
        <div className="stats">
          <article className="card stat">
            <label>Booked revenue</label>
            <strong>{formatMoney(revenue)}</strong>
            <div className="delta up">{formatMoney(openRevenue)} still open</div>
          </article>
          <article className="card stat">
            <label>Fuel + shop</label>
            <strong>{formatMoney(fuelSpend + shop)}</strong>
            <div className="delta">Fuel {formatMoney(fuelSpend)} · shop {formatMoney(shop)}</div>
          </article>
          <article className="card stat">
            <label>Trip miles</label>
            <strong>{formatNumber(miles)}</strong>
            <div className="delta">{data.trips.length} trips</div>
          </article>
          <article className="card stat">
            <label>Completed vs delayed</label>
            <strong>
              {completed}/{delayed}
            </strong>
            <div className="delta">Completed / delayed</div>
          </article>
        </div>
        <div className="grid-2">
          <section className="card card-pad">
            <div className="card-head">
              <h2>Revenue by customer</h2>
            </div>
            {customers.map(([name, value]) => (
              <div className="bar-row" key={name}>
                <span>{name}</span>
                <div className="bar-track">
                  <b style={{ width: `${Math.round((value / Math.max(customers[0]?.[1] ?? 1, 1)) * 100)}%` }} />
                </div>
                <strong className="small">{formatMoney(value)}</strong>
              </div>
            ))}
          </section>
          <section className="card card-pad">
            <div className="card-head">
              <h2>Fleet status mix</h2>
            </div>
            {statusCounts.map((row) => (
              <div className="bar-row" key={row.status}>
                <span>{labelize(row.status)}</span>
                <div className="bar-track">
                  <b style={{ width: `${Math.round((row.count / vehicleTotal) * 100)}%` }} />
                </div>
                <strong className="small">{row.count}</strong>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PageGate>
  )
}
