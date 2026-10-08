import type {
  Alert,
  Driver,
  DriverInput,
  FleetState,
  FuelLog,
  FuelLogInput,
  Load,
  LoadInput,
  MaintenanceInput,
  MaintenanceOrder,
  Trip,
  TripInput,
  User,
  UserInput,
  UserRole,
  UserStatus,
  Vehicle,
  VehicleInput,
} from '../types'
import { createId, wait } from '../utils/misc'
import { getState, mutate, resetState } from './store'

export async function fetchFleet(): Promise<FleetState> {
  await wait()
  return getState()
}

export async function restoreDemoData(): Promise<FleetState> {
  await wait(160)
  return resetState()
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  await wait()
  const vehicle: Vehicle = { ...input, id: createId('veh') }
  mutate((state) => ({ ...state, vehicles: [vehicle, ...state.vehicles] }))
  return vehicle
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  await wait()
  let updated: Vehicle | undefined
  mutate((state) => ({
    ...state,
    vehicles: state.vehicles.map((vehicle) => {
      if (vehicle.id !== id) return vehicle
      updated = { ...vehicle, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('Vehicle not found.')
  return updated
}

export async function deleteVehicle(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id),
  }))
}

export async function createDriver(input: DriverInput): Promise<Driver> {
  await wait()
  const driver: Driver = { ...input, id: createId('drv') }
  mutate((state) => ({ ...state, drivers: [driver, ...state.drivers] }))
  return driver
}

export async function updateDriver(id: string, input: DriverInput): Promise<Driver> {
  await wait()
  let updated: Driver | undefined
  mutate((state) => ({
    ...state,
    drivers: state.drivers.map((driver) => {
      if (driver.id !== id) return driver
      updated = { ...driver, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('Driver not found.')
  return updated
}

export async function deleteDriver(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    drivers: state.drivers.filter((driver) => driver.id !== id),
  }))
}

export async function createTrip(input: TripInput): Promise<Trip> {
  await wait()
  const trip: Trip = { ...input, id: createId('trp') }
  mutate((state) => ({ ...state, trips: [trip, ...state.trips] }))
  return trip
}

export async function updateTrip(id: string, input: TripInput): Promise<Trip> {
  await wait()
  let updated: Trip | undefined
  mutate((state) => ({
    ...state,
    trips: state.trips.map((trip) => {
      if (trip.id !== id) return trip
      updated = { ...trip, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('Trip not found.')
  return updated
}

export async function deleteTrip(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    trips: state.trips.filter((trip) => trip.id !== id),
  }))
}

export async function createLoad(input: LoadInput): Promise<Load> {
  await wait()
  const load: Load = { ...input, id: createId('lod') }
  mutate((state) => ({ ...state, loads: [load, ...state.loads] }))
  return load
}

export async function updateLoad(id: string, input: LoadInput): Promise<Load> {
  await wait()
  let updated: Load | undefined
  mutate((state) => ({
    ...state,
    loads: state.loads.map((load) => {
      if (load.id !== id) return load
      updated = { ...load, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('Load not found.')
  return updated
}

export async function deleteLoad(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    loads: state.loads.filter((load) => load.id !== id),
  }))
}

export async function createMaintenance(input: MaintenanceInput): Promise<MaintenanceOrder> {
  await wait()
  const order: MaintenanceOrder = { ...input, id: createId('mnt') }
  mutate((state) => ({ ...state, maintenance: [order, ...state.maintenance] }))
  return order
}

export async function updateMaintenance(
  id: string,
  input: MaintenanceInput,
): Promise<MaintenanceOrder> {
  await wait()
  let updated: MaintenanceOrder | undefined
  mutate((state) => ({
    ...state,
    maintenance: state.maintenance.map((order) => {
      if (order.id !== id) return order
      updated = { ...order, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('Work order not found.')
  return updated
}

export async function deleteMaintenance(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    maintenance: state.maintenance.filter((order) => order.id !== id),
  }))
}

export async function createFuelLog(input: FuelLogInput): Promise<FuelLog> {
  await wait()
  const log: FuelLog = { ...input, id: createId('fuel') }
  mutate((state) => ({ ...state, fuelLogs: [log, ...state.fuelLogs] }))
  return log
}

export async function deleteFuelLog(id: string): Promise<void> {
  await wait()
  mutate((state) => ({
    ...state,
    fuelLogs: state.fuelLogs.filter((log) => log.id !== id),
  }))
}

export async function markAlertRead(id: string, read = true): Promise<Alert> {
  await wait(80)
  let updated: Alert | undefined
  mutate((state) => ({
    ...state,
    alerts: state.alerts.map((alert) => {
      if (alert.id !== id) return alert
      updated = { ...alert, read }
      return updated
    }),
  }))
  if (!updated) throw new Error('Alert not found.')
  return updated
}

export async function markAllAlertsRead(): Promise<void> {
  await wait(80)
  mutate((state) => ({
    ...state,
    alerts: state.alerts.map((alert) => ({ ...alert, read: true })),
  }))
}

export async function createDVIR(input: import('../types').DVIRInput): Promise<import('../types').DVIRInspection> {
  await wait()
  const inspection: import('../types').DVIRInspection = { ...input, id: createId('dvir') }
  mutate((state) => ({
    ...state,
    dvirInspections: [inspection, ...(state.dvirInspections ?? [])],
  }))
  return inspection
}

export async function createAlert(input: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<Alert> {
  await wait(50)
  const alert: Alert = {
    ...input,
    id: createId('alt'),
    createdAt: new Date().toISOString(),
    read: false,
  }
  mutate((state) => ({
    ...state,
    alerts: [alert, ...state.alerts],
  }))
  return alert
}

export async function saveSettings(settings: FleetState['settings']): Promise<FleetState['settings']> {
  await wait(160)
  mutate((state) => ({ ...state, settings }))
  return settings
}

export async function fetchUsers(): Promise<User[]> {
  await wait(120)
  return getState().users || []
}

export async function createUser(input: UserInput): Promise<User> {
  await wait(150)
  const user: User = {
    ...input,
    id: createId('usr'),
    createdAt: new Date().toISOString().slice(0, 10),
  }
  mutate((state) => ({
    ...state,
    users: [...(state.users || []), user],
  }))
  return user
}

export async function updateUser(id: string, input: Partial<UserInput>): Promise<User> {
  await wait(150)
  let updated: User | undefined
  mutate((state) => ({
    ...state,
    users: (state.users || []).map((u) => {
      if (u.id !== id) return u
      updated = { ...u, ...input }
      return updated
    }),
  }))
  if (!updated) throw new Error('User not found.')
  return updated
}

export async function elevateUserRole(id: string, role: UserRole): Promise<User> {
  await wait(150)
  let updated: User | undefined
  mutate((state) => ({
    ...state,
    users: (state.users || []).map((u) => {
      if (u.id !== id) return u
      updated = { ...u, role }
      return updated
    }),
  }))
  if (!updated) throw new Error('User not found.')
  return updated
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<User> {
  await wait(150)
  let updated: User | undefined
  mutate((state) => ({
    ...state,
    users: (state.users || []).map((u) => {
      if (u.id !== id) return u
      updated = { ...u, status }
      return updated
    }),
  }))
  if (!updated) throw new Error('User not found.')
  return updated
}

export async function deleteUser(id: string): Promise<void> {
  await wait(150)
  mutate((state) => ({
    ...state,
    users: (state.users || []).filter((u) => u.id !== id),
  }))
}

