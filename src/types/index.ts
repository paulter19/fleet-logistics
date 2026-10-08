export type UserRole = 'fleet_manager' | 'dispatcher' | 'driver' | 'mechanic'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  title: string
  company: string
}

export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'out_of_service'
export type VehicleType = 'tractor' | 'straight_truck' | 'van' | 'reefer'

export interface Vehicle {
  id: string
  unitNumber: string
  vin: string
  plate: string
  make: string
  model: string
  year: number
  type: VehicleType
  status: VehicleStatus
  mileage: number
  location: string
  assignedDriverId: string | null
  fuelLevel: number
  lastServiceAt: string
  nextServiceDueMiles: number
}

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'on_leave'
export type LicenseClass = 'CDL-A' | 'CDL-B' | 'CDL-C'

export interface Driver {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: DriverStatus
  licenseClass: LicenseClass
  licenseNumber: string
  licenseExpiresAt: string
  hireDate: string
  hosHoursRemaining: number
  assignedVehicleId: string | null
  homeTerminal: string
}

export type TripStatus = 'scheduled' | 'in_transit' | 'completed' | 'delayed' | 'cancelled'

export interface Trip {
  id: string
  tripNumber: string
  origin: string
  destination: string
  vehicleId: string | null
  driverId: string | null
  loadId: string | null
  status: TripStatus
  scheduledStart: string
  eta: string
  miles: number
  progress: number
  notes: string
}

export type LoadStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'exception'
export type LoadPriority = 'standard' | 'expedited' | 'critical'

export interface Load {
  id: string
  loadNumber: string
  customer: string
  pickup: string
  dropoff: string
  commodity: string
  weightLbs: number
  pieces: number
  status: LoadStatus
  priority: LoadPriority
  revenue: number
  pickupWindow: string
  deliveryWindow: string
  assignedTripId: string | null
}

export type MaintenanceType = 'preventive' | 'repair' | 'inspection' | 'recall'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue'

export interface MaintenanceOrder {
  id: string
  workOrder: string
  vehicleId: string
  type: MaintenanceType
  status: MaintenanceStatus
  title: string
  vendor: string
  scheduledAt: string
  completedAt: string | null
  cost: number
  notes: string
}

export interface FuelLog {
  id: string
  vehicleId: string
  driverId: string | null
  filledAt: string
  gallons: number
  pricePerGallon: number
  station: string
  location: string
  odometer: number
}

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertType =
  | 'maintenance'
  | 'hos'
  | 'delay'
  | 'fuel'
  | 'document'
  | 'geofence'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  createdAt: string
  read: boolean
  relatedVehicleId: string | null
  relatedDriverId: string | null
  relatedTripId: string | null
}

export interface CompanySettings {
  name: string
  terminal: string
  timezone: string
  unitSystem: 'imperial' | 'metric'
  emailAlerts: boolean
  smsAlerts: boolean
}

export interface FleetState {
  vehicles: Vehicle[]
  drivers: Driver[]
  trips: Trip[]
  loads: Load[]
  maintenance: MaintenanceOrder[]
  fuelLogs: FuelLog[]
  alerts: Alert[]
  settings: CompanySettings
}

export interface VehicleInput {
  unitNumber: string
  vin: string
  plate: string
  make: string
  model: string
  year: number
  type: VehicleType
  status: VehicleStatus
  mileage: number
  location: string
  assignedDriverId: string | null
  fuelLevel: number
  lastServiceAt: string
  nextServiceDueMiles: number
}

export interface DriverInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  status: DriverStatus
  licenseClass: LicenseClass
  licenseNumber: string
  licenseExpiresAt: string
  hireDate: string
  hosHoursRemaining: number
  assignedVehicleId: string | null
  homeTerminal: string
}

export interface TripInput {
  tripNumber: string
  origin: string
  destination: string
  vehicleId: string | null
  driverId: string | null
  loadId: string | null
  status: TripStatus
  scheduledStart: string
  eta: string
  miles: number
  progress: number
  notes: string
}

export interface LoadInput {
  loadNumber: string
  customer: string
  pickup: string
  dropoff: string
  commodity: string
  weightLbs: number
  pieces: number
  status: LoadStatus
  priority: LoadPriority
  revenue: number
  pickupWindow: string
  deliveryWindow: string
  assignedTripId: string | null
}

export interface MaintenanceInput {
  workOrder: string
  vehicleId: string
  type: MaintenanceType
  status: MaintenanceStatus
  title: string
  vendor: string
  scheduledAt: string
  completedAt: string | null
  cost: number
  notes: string
}

export interface FuelLogInput {
  vehicleId: string
  driverId: string | null
  filledAt: string
  gallons: number
  pricePerGallon: number
  station: string
  location: string
  odometer: number
}

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  tone: ToastTone
  title: string
  description?: string
}
