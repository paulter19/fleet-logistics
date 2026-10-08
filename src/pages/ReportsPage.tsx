import { useState } from 'react'
import { PageGate } from '../components/PageGate'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { useFleet } from '../hooks/useFleet'
import { useToast } from '../hooks/useToast'
import { exportToCSV } from '../utils/csv'
import { formatMoney, labelize } from '../utils/format'

export function ReportsPage() {
  const { data, loading, error } = useFleet()
  const { notify } = useToast()
  const [period, setPeriod] = useState<'all' | 'm' | 'q'>('all')

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
  const fuelGallons = data.fuelLogs.reduce((s, l) => s + l.gallons, 0)
  const shop = data.maintenance.reduce((s, o) => s + o.cost, 0)
  const miles = data.trips.reduce((s, t) => s + t.miles, 0)
  const completed = data.trips.filter((t) => t.status === 'completed').length
  const delayed = data.trips.filter((t) => t.status === 'delayed').length
  const totalCost = fuelSpend + shop
  const costPerMile = miles > 0 ? totalCost / miles : 0
  const revPerMile = miles > 0 ? revenue / miles : 0
  const avgMpg = fuelGallons > 0 ? miles / fuelGallons : 6.8

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

  const handleExportCSV = () => {
    const reportData = [
      { Metric: 'Total Booked Revenue', Value: `$${revenue.toLocaleString()}` },
      { Metric: 'Open / In-Transit Revenue', Value: `$${openRevenue.toLocaleString()}` },
      { Metric: 'Total Fuel Expense', Value: `$${fuelSpend.toFixed(2)}` },
      { Metric: 'Total Shop Maintenance Cost', Value: `$${shop.toFixed(2)}` },
      { Metric: 'Combined Operating Cost', Value: `$${totalCost.toFixed(2)}` },
      { Metric: 'Total Fleet Miles Dispatched', Value: miles.toLocaleString() },
      { Metric: 'Revenue Per Mile (RPM)', Value: `$${revPerMile.toFixed(2)}/mi` },
      { Metric: 'Operating Cost Per Mile (CPM)', Value: `$${costPerMile.toFixed(2)}/mi` },
      { Metric: 'Net Operational Spread', Value: `$${(revPerMile - costPerMile).toFixed(2)}/mi` },
      { Metric: 'Estimated Fleet Average MPG', Value: `${avgMpg.toFixed(1)} MPG` },
      { Metric: 'Completed Trips', Value: String(completed) },
      { Metric: 'Delayed Trips', Value: String(delayed) },
    ]

    exportToCSV('fleet_performance_summary', reportData, [
      { key: 'Metric', label: 'Performance Metric' },
      { key: 'Value', label: 'Reported Value' },
    ])
    notify('info', 'Exported performance analytics to CSV')
  }

  return (
    <PageGate loading={loading} error={error} ready>
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Reports & Fleet Intelligence</h1>
            <p>Financial, operational, and efficiency KPIs computed from fleet records</p>
          </div>
          <div className="header-actions">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="all">All-Time Rollup</option>
              <option value="q">Current Quarter (Q4)</option>
              <option value="m">Current Month</option>
            </Select>
            <Button variant="ghost" onClick={handleExportCSV}>
              Export Summary CSV
            </Button>
          </div>
        </div>

        <div className="stats">
          <article className="card stat">
            <label>Booked revenue</label>
            <strong>{formatMoney(revenue)}</strong>
            <div className="delta up">{formatMoney(openRevenue)} open / in-transit</div>
          </article>
          <article className="card stat">
            <label>Fuel + Shop Spend</label>
            <strong>{formatMoney(fuelSpend + shop)}</strong>
            <div className="delta">Fuel {formatMoney(fuelSpend)} · Shop {formatMoney(shop)}</div>
          </article>
          <article className="card stat">
            <label>Cost vs Rev / Mile</label>
            <strong>${costPerMile.toFixed(2)} / ${revPerMile.toFixed(2)}</strong>
            <div className="delta up">+${(revPerMile - costPerMile).toFixed(2)}/mi spread</div>
          </article>
          <article className="card stat">
            <label>On-Time Delivery</label>
            <strong>
              {completed + delayed > 0 ? `${Math.round((completed / (completed + delayed)) * 100)}%` : '100%'}
            </strong>
            <div className="delta">{completed} completed · {delayed} delayed</div>
          </article>
        </div>

        <div className="grid-2">
          <section className="card card-pad">
            <div className="card-head">
              <h2>Top Customers by Revenue</h2>
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
              <h2>Fleet Status Distribution</h2>
            </div>
            {statusCounts.map((row) => (
              <div className="bar-row" key={row.status}>
                <span>{labelize(row.status)}</span>
                <div className="bar-track">
                  <b style={{ width: `${Math.round((row.count / vehicleTotal) * 100)}%` }} />
                </div>
                <strong className="small">{row.count} units</strong>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PageGate>
  )
}

