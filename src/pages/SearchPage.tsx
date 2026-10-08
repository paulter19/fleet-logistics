import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageGate } from '../components/PageGate'
import { EmptyState } from '../components/ui/Feedback'
import { useFleet } from '../hooks/useFleet'
import { driverName } from '../utils/format'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const { data, loading, error } = useFleet()

  const results = useMemo(() => {
    if (!data || !q) return { vehicles: [], drivers: [], loads: [], trips: [] }
    return {
      vehicles: data.vehicles.filter((v) =>
        `${v.unitNumber} ${v.make} ${v.model} ${v.plate} ${v.location}`.toLowerCase().includes(q),
      ),
      drivers: data.drivers.filter((d) =>
        `${d.firstName} ${d.lastName} ${d.email} ${d.homeTerminal}`.toLowerCase().includes(q),
      ),
      loads: data.loads.filter((l) =>
        `${l.loadNumber} ${l.customer} ${l.pickup} ${l.dropoff} ${l.commodity}`.toLowerCase().includes(q),
      ),
      trips: data.trips.filter((t) => `${t.tripNumber} ${t.origin} ${t.destination}`.toLowerCase().includes(q)),
    }
  }, [data, q])

  const total =
    results.vehicles.length + results.drivers.length + results.loads.length + results.trips.length

  return (
    <PageGate loading={loading} error={error} ready={Boolean(data)}>
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Search</h1>
            <p>{q ? `Results for “${params.get('q')}”` : 'Type in the header and press Enter'}</p>
          </div>
        </div>
        {!q ? (
          <div className="card">
            <EmptyState title="Start a search" body="Use the top bar to look up units, drivers, loads, or trips." />
          </div>
        ) : total === 0 ? (
          <div className="card">
            <EmptyState title="No matches" body="Try a unit number, driver name, or city." />
          </div>
        ) : (
          <div className="grid-2">
            <ResultList title="Vehicles" items={results.vehicles.map((v) => ({ to: `/vehicles/${v.id}`, label: v.unitNumber, sub: `${v.year} ${v.make} ${v.model}` }))} />
            <ResultList title="Drivers" items={results.drivers.map((d) => ({ to: `/drivers/${d.id}`, label: driverName(d.firstName, d.lastName), sub: d.homeTerminal }))} />
            <ResultList title="Loads" items={results.loads.map((l) => ({ to: `/loads/${l.id}`, label: l.loadNumber, sub: l.customer }))} />
            <ResultList title="Trips" items={results.trips.map((t) => ({ to: `/dispatch/${t.id}`, label: t.tripNumber, sub: `${t.origin} → ${t.destination}` }))} />
          </div>
        )}
      </div>
    </PageGate>
  )
}

function ResultList({
  title,
  items,
}: {
  title: string
  items: { to: string; label: string; sub: string }[]
}) {
  return (
    <section className="card card-pad">
      <div className="card-head">
        <h2>{title}</h2>
        <span className="small muted">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="muted small">None</p>
      ) : (
        items.map((item) => (
          <div className="list-item" key={item.to}>
            <div>
              <Link to={item.to} className="cell-strong">
                {item.label}
              </Link>
              <div className="small muted">{item.sub}</div>
            </div>
          </div>
        ))
      )}
    </section>
  )
}
