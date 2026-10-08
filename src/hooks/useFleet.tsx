import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as fleetService from '../services/fleetService'
import type {
  DriverInput,
  FleetState,
  FuelLogInput,
  LoadInput,
  MaintenanceInput,
  TripInput,
  VehicleInput,
} from '../types'

interface FleetContextValue {
  data: FleetState | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createVehicle: (input: VehicleInput) => Promise<void>
  updateVehicle: (id: string, input: VehicleInput) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  createDriver: (input: DriverInput) => Promise<void>
  updateDriver: (id: string, input: DriverInput) => Promise<void>
  deleteDriver: (id: string) => Promise<void>
  createTrip: (input: TripInput) => Promise<void>
  updateTrip: (id: string, input: TripInput) => Promise<void>
  deleteTrip: (id: string) => Promise<void>
  createLoad: (input: LoadInput) => Promise<void>
  updateLoad: (id: string, input: LoadInput) => Promise<void>
  deleteLoad: (id: string) => Promise<void>
  createMaintenance: (input: MaintenanceInput) => Promise<void>
  updateMaintenance: (id: string, input: MaintenanceInput) => Promise<void>
  deleteMaintenance: (id: string) => Promise<void>
  createFuelLog: (input: FuelLogInput) => Promise<void>
  deleteFuelLog: (id: string) => Promise<void>
  markAlertRead: (id: string, read?: boolean) => Promise<void>
  markAllAlertsRead: () => Promise<void>
  saveSettings: (settings: FleetState['settings']) => Promise<void>
  restoreDemoData: () => Promise<void>
}

const FleetContext = createContext<FleetContextValue | null>(null)

export function FleetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fleetService.fetchFleet()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load fleet data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = useCallback(async (task: () => Promise<unknown>) => {
    setError(null)
    await task()
    setData(await fleetService.fetchFleet())
  }, [])

  const value = useMemo<FleetContextValue>(
    () => ({
      data,
      loading,
      error,
      refresh,
      createVehicle: (input) => run(() => fleetService.createVehicle(input)),
      updateVehicle: (id, input) => run(() => fleetService.updateVehicle(id, input)),
      deleteVehicle: (id) => run(() => fleetService.deleteVehicle(id)),
      createDriver: (input) => run(() => fleetService.createDriver(input)),
      updateDriver: (id, input) => run(() => fleetService.updateDriver(id, input)),
      deleteDriver: (id) => run(() => fleetService.deleteDriver(id)),
      createTrip: (input) => run(() => fleetService.createTrip(input)),
      updateTrip: (id, input) => run(() => fleetService.updateTrip(id, input)),
      deleteTrip: (id) => run(() => fleetService.deleteTrip(id)),
      createLoad: (input) => run(() => fleetService.createLoad(input)),
      updateLoad: (id, input) => run(() => fleetService.updateLoad(id, input)),
      deleteLoad: (id) => run(() => fleetService.deleteLoad(id)),
      createMaintenance: (input) => run(() => fleetService.createMaintenance(input)),
      updateMaintenance: (id, input) => run(() => fleetService.updateMaintenance(id, input)),
      deleteMaintenance: (id) => run(() => fleetService.deleteMaintenance(id)),
      createFuelLog: (input) => run(() => fleetService.createFuelLog(input)),
      deleteFuelLog: (id) => run(() => fleetService.deleteFuelLog(id)),
      markAlertRead: (id, read) => run(() => fleetService.markAlertRead(id, read)),
      markAllAlertsRead: () => run(() => fleetService.markAllAlertsRead()),
      saveSettings: (settings) => run(() => fleetService.saveSettings(settings)),
      restoreDemoData: () => run(() => fleetService.restoreDemoData()),
    }),
    [data, error, loading, refresh, run],
  )

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext)
  if (!ctx) throw new Error('useFleet must be used within FleetProvider')
  return ctx
}
