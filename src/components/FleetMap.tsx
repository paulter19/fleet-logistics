import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Driver, Trip, Vehicle } from '../types'
import { driverName, formatMiles } from '../utils/format'

interface CityNode {
  id: string
  name: string
  x: number // 0 - 1000 viewBox
  y: number // 0 - 600 viewBox
}

const CITIES: Record<string, CityNode> = {
  'Dallas, TX': { id: 'DAL', name: 'Dallas, TX', x: 500, y: 440 },
  'Houston, TX': { id: 'HOU', name: 'Houston, TX', x: 520, y: 490 },
  'San Antonio, TX': { id: 'SAT', name: 'San Antonio, TX', x: 480, y: 480 },
  'Austin, TX': { id: 'AUS', name: 'Austin, TX', x: 490, y: 460 },
  'Oklahoma City, OK': { id: 'OKC', name: 'Oklahoma City, OK', x: 490, y: 380 },
  'Memphis, TN': { id: 'MEM', name: 'Memphis, TN', x: 620, y: 370 },
  'Nashville, TN': { id: 'BNA', name: 'Nashville, TN', x: 670, y: 350 },
  'Atlanta, GA': { id: 'ATL', name: 'Atlanta, GA', x: 720, y: 400 },
  'Chicago, IL': { id: 'ORD', name: 'Chicago, IL', x: 620, y: 240 },
  'Indianapolis, IN': { id: 'IND', name: 'Indianapolis, IN', x: 660, y: 280 },
  'Kansas City, MO': { id: 'MCI', name: 'Kansas City, MO', x: 520, y: 300 },
  'St. Louis, MO': { id: 'STL', name: 'St. Louis, MO', x: 580, y: 310 },
  'Denver, CO': { id: 'DEN', name: 'Denver, CO', x: 360, y: 290 },
  'Phoenix, AZ': { id: 'PHX', name: 'Phoenix, AZ', x: 230, y: 420 },
  'Los Angeles, CA': { id: 'LAX', name: 'Los Angeles, CA', x: 120, y: 380 },
  'Seattle, WA': { id: 'SEA', name: 'Seattle, WA', x: 130, y: 110 },
  'Charlotte, NC': { id: 'CLT', name: 'Charlotte, NC', x: 770, y: 360 },
  'Columbus, OH': { id: 'CMH', name: 'Columbus, OH', x: 700, y: 270 },
  'Detroit, MI': { id: 'DTW', name: 'Detroit, MI', x: 690, y: 220 },
}

function findCoordinates(locationName: string): { x: number; y: number } {
  for (const [key, node] of Object.entries(CITIES)) {
    if (locationName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(locationName.toLowerCase())) {
      return { x: node.x, y: node.y }
    }
  }
  // Fallback hashing for demo locations (like "En route I-35, OK")
  if (locationName.includes('I-35')) return { x: 495, y: 410 }
  if (locationName.includes('I-40')) return { x: 550, y: 375 }
  if (locationName.includes('I-10')) return { x: 380, y: 450 }
  if (locationName.includes('I-80')) return { x: 480, y: 250 }
  if (locationName.includes('I-75')) return { x: 700, y: 330 }
  
  // deterministic pseudo-coord
  let hash = 0
  for (let i = 0; i < locationName.length; i++) hash = (hash * 31 + locationName.charCodeAt(i)) % 1000
  return { x: 300 + (hash % 450), y: 200 + ((hash * 7) % 250) }
}

export function FleetMap({
  vehicles,
  trips,
  drivers,
}: {
  vehicles: Vehicle[]
  trips: Trip[]
  drivers: Driver[]
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'maintenance'>('all')

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'active') return v.status === 'active'
    if (filter === 'idle') return v.status === 'idle'
    if (filter === 'maintenance') return v.status === 'maintenance' || v.status === 'out_of_service'
    return true
  })

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const selectedDriver = drivers.find((d) => d.id === selectedVehicle?.assignedDriverId)
  const activeTrip = trips.find((t) => t.vehicleId === selectedVehicle?.id && (t.status === 'in_transit' || t.status === 'delayed'))

  return (
    <div className="fleet-map-container">
      <div className="map-toolbar">
        <div className="map-legend">
          <span className="legend-item"><span className="dot active" /> Active ({vehicles.filter((v) => v.status === 'active').length})</span>
          <span className="legend-item"><span className="dot info" /> Idle ({vehicles.filter((v) => v.status === 'idle').length})</span>
          <span className="legend-item"><span className="dot warning" /> Maintenance ({vehicles.filter((v) => v.status === 'maintenance').length})</span>
          <span className="legend-item"><span className="dot critical" /> Out of Service ({vehicles.filter((v) => v.status === 'out_of_service').length})</span>
        </div>
        <div className="map-filter-group">
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            All Units
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('active')}
          >
            Live In-Transit
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'idle' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('idle')}
          >
            Idle
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'maintenance' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('maintenance')}
          >
            Shop / Issues
          </button>
        </div>
      </div>

      <div className="map-canvas-wrap">
        <svg viewBox="0 0 1000 600" className="map-svg" preserveAspectRatio="xMidYMid meet">
          {/* US Landmass Silhouette simplified grid */}
          <rect width="1000" height="600" fill="var(--navy-950)" rx="12" />
          
          {/* Subtle Radar/Corridor Grids */}
          <g opacity="0.08" stroke="#38bdf8" strokeWidth="1">
            <line x1="100" y1="0" x2="100" y2="600" />
            <line x1="250" y1="0" x2="250" y2="600" />
            <line x1="400" y1="0" x2="400" y2="600" />
            <line x1="550" y1="0" x2="550" y2="600" />
            <line x1="700" y1="0" x2="700" y2="600" />
            <line x1="850" y1="0" x2="850" y2="600" />
            <line x1="0" y1="150" x2="1000" y2="150" />
            <line x1="0" y1="300" x2="1000" y2="300" />
            <line x1="0" y1="450" x2="1000" y2="450" />
          </g>

          {/* Interstate Highway Corridors */}
          <g stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.5" strokeDasharray="3 3">
            {/* I-35: Dallas - OKC - KC - Chicago */}
            <path d="M 520 490 L 500 440 L 490 380 L 520 300 L 620 240" />
            {/* I-40: LA - PHX - OKC - MEM - BNA - CLT */}
            <path d="M 120 380 L 230 420 L 490 380 L 620 370 L 670 350 L 770 360" />
            {/* I-10: LA - PHX - SAT - HOU */}
            <path d="M 120 380 L 230 420 L 480 480 L 520 490" />
            {/* I-70: DEN - KC - STL - IND - CMH */}
            <path d="M 360 290 L 520 300 L 580 310 L 660 280 L 700 270" />
            {/* I-75: DET - CMH - ATL */}
            <path d="M 690 220 L 700 270 L 720 400" />
            {/* I-80 / I-90 North */}
            <path d="M 130 110 L 360 290 L 620 240 L 690 220" />
          </g>

          {/* Active Trip Routes */}
          <g>
            {trips
              .filter((t) => t.status === 'in_transit' || t.status === 'delayed')
              .map((t) => {
                const start = findCoordinates(t.origin)
                const end = findCoordinates(t.destination)
                const isSelected = selectedVehicle?.id === t.vehicleId
                return (
                  <g key={t.id}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={t.status === 'delayed' ? '#ef4444' : '#f59e0b'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray="6 4"
                      className="animated-corridor-line"
                    />
                    <circle cx={start.x} cy={start.y} r="3" fill="#94a3b8" />
                    <circle cx={end.x} cy={end.y} r="4" fill="#38bdf8" />
                  </g>
                )
              })}
          </g>

          {/* Hub Terminal Cities */}
          <g>
            {Object.values(CITIES).map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle r="4" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                <text x="7" y="4" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                  {node.name.split(',')[0]}
                </text>
              </g>
            ))}
          </g>

          {/* Vehicle Markers */}
          <g>
            {filteredVehicles.map((vehicle) => {
              const coords = findCoordinates(vehicle.location)
              const isSelected = selectedVehicleId === vehicle.id
              let markerColor = '#10b981' // active
              if (vehicle.status === 'idle') markerColor = '#38bdf8'
              if (vehicle.status === 'maintenance') markerColor = '#f59e0b'
              if (vehicle.status === 'out_of_service') markerColor = '#ef4444'

              return (
                <g
                  key={vehicle.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedVehicleId(vehicle.id === selectedVehicleId ? null : vehicle.id)}
                >
                  {/* Ping wave for active vehicle */}
                  {vehicle.status === 'active' && (
                    <circle r="14" fill={markerColor} opacity="0.2" className="ping-wave" />
                  )}
                  {isSelected && (
                    <circle r="18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                  )}
                  {/* Pin Background */}
                  <circle r="9" fill={markerColor} stroke="#ffffff" strokeWidth="2" />
                  {/* Unit Label */}
                  <rect x="-24" y="-24" width="48" height="15" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={markerColor} strokeWidth="0.8" />
                  <text x="0" y="-13" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                    {vehicle.unitNumber}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Selected Vehicle Telemetry Floating Card */}
        {selectedVehicle && (
          <div className="map-vehicle-card card card-pad">
            <div className="card-head">
              <div>
                <strong>{selectedVehicle.unitNumber}</strong>
                <span className="small muted"> · {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedVehicleId(null)}>✕</button>
            </div>
            <div className="telemetry-grid">
              <div>
                <span className="small muted">Status</span>
                <div className={`tag ${selectedVehicle.status}`}>{selectedVehicle.status.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="small muted">Current Position</span>
                <div className="small font-medium">{selectedVehicle.location}</div>
              </div>
              <div>
                <span className="small muted">Driver</span>
                <div className="small">{selectedDriver ? driverName(selectedDriver.firstName, selectedDriver.lastName) : 'Unassigned'}</div>
              </div>
              <div>
                <span className="small muted">Fuel Level</span>
                <div className="small font-medium">{selectedVehicle.fuelLevel}%</div>
              </div>
              <div>
                <span className="small muted">Odometer</span>
                <div className="small">{formatMiles(selectedVehicle.mileage)}</div>
              </div>
              {activeTrip && (
                <div>
                  <span className="small muted">Active Trip</span>
                  <div className="small text-accent">{activeTrip.tripNumber} ({activeTrip.origin} → {activeTrip.destination})</div>
                </div>
              )}
            </div>
            <div className="card-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Link to={`/vehicles/${selectedVehicle.id}`} className="btn btn-sm btn-ghost" style={{ flex: 1, textAlign: 'center' }}>
                Unit Profile
              </Link>
              {activeTrip && (
                <Link to={`/dispatch/${activeTrip.id}`} className="btn btn-sm btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                  Trip Live Board
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
