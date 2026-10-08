import { labelize } from '../utils/format'
import { Badge } from './ui/Badge'

const vehicleTone = {
  active: 'success',
  idle: 'neutral',
  maintenance: 'warning',
  out_of_service: 'danger',
} as const

const driverTone = {
  available: 'success',
  on_trip: 'info',
  off_duty: 'neutral',
  on_leave: 'warning',
} as const

const tripTone = {
  scheduled: 'neutral',
  in_transit: 'info',
  completed: 'success',
  delayed: 'warning',
  cancelled: 'danger',
} as const

const loadTone = {
  pending: 'neutral',
  assigned: 'info',
  in_transit: 'info',
  delivered: 'success',
  exception: 'danger',
} as const

const maintTone = {
  scheduled: 'neutral',
  in_progress: 'info',
  completed: 'success',
  overdue: 'danger',
} as const

export function StatusBadge({
  value,
  map,
}: {
  value: string
  map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'>
}) {
  return <Badge tone={map[value] ?? 'neutral'}>{labelize(value)}</Badge>
}

export function VehicleStatusBadge({ value }: { value: keyof typeof vehicleTone }) {
  return <StatusBadge value={value} map={vehicleTone} />
}
export function DriverStatusBadge({ value }: { value: keyof typeof driverTone }) {
  return <StatusBadge value={value} map={driverTone} />
}
export function TripStatusBadge({ value }: { value: keyof typeof tripTone }) {
  return <StatusBadge value={value} map={tripTone} />
}
export function LoadStatusBadge({ value }: { value: keyof typeof loadTone }) {
  return <StatusBadge value={value} map={loadTone} />
}
export function MaintenanceStatusBadge({ value }: { value: keyof typeof maintTone }) {
  return <StatusBadge value={value} map={maintTone} />
}
