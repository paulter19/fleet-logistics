import { seedFleet } from '../data/seed'
import type { FleetState } from '../types'
import { clone } from '../utils/misc'

const KEY = 'fleetlogistics.data.v1'

let memory: FleetState | null = null

export function getState(): FleetState {
  if (!memory) memory = loadState()
  return memory
}

export function setState(next: FleetState): FleetState {
  memory = next
  localStorage.setItem(KEY, JSON.stringify(next))
  return memory
}

export function mutate(updater: (state: FleetState) => FleetState): FleetState {
  return setState(updater(clone(getState())))
}

export function resetState(): FleetState {
  return setState(seedFleet())
}

function loadState(): FleetState {
  const seeded = seedFleet()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FleetState>
      return {
        ...seeded,
        ...parsed,
        users: parsed.users && parsed.users.length > 0 ? parsed.users : seeded.users,
        dvirInspections: parsed.dvirInspections ?? seeded.dvirInspections ?? [],
      }
    }
  } catch {
    /* ignore corrupt cache */
  }
  localStorage.setItem(KEY, JSON.stringify(seeded))
  return seeded
}
