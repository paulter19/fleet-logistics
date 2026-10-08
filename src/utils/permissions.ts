import type { UserRole } from '../types'

export const ROLE_LABELS: Record<UserRole, string> = {
  fleet_manager: 'Fleet Manager (Admin)',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety & Compliance',
  mechanic: 'Maintenance Tech',
  driver: 'Commercial Driver',
  staff: 'Operations Associate (Staff)',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  fleet_manager: 'Full root access: User management, privilege elevation, company configuration, financial reports, and all delete operations.',
  dispatcher: 'Operational access: Trips, loads, routes, drivers, vehicle assignments, and real-time fleet map.',
  safety_officer: 'Compliance access: HOS logs, safety scores, DVIR inspections, incident reports, and risk alerts.',
  mechanic: 'Fleet service access: Work orders, preventative maintenance, DVIR defect logs, and fuel tracking.',
  driver: 'Driver portal: Assigned active trips, turn-by-turn routes, personal HOS clock, and DVIR submission.',
  staff: 'Standard staff access: Read & write operations for trips, loads, units, and fuel. Cannot delete records or manage users above them.',
}

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  fleet_manager: { bg: '#818cf822', text: '#818cf8', border: '#818cf855' },
  dispatcher: { bg: '#38bdf822', text: '#38bdf8', border: '#38bdf855' },
  safety_officer: { bg: '#fbbf2422', text: '#fbbf24', border: '#fbbf2455' },
  mechanic: { bg: '#f9731622', text: '#f97316', border: '#f9731655' },
  driver: { bg: '#34d39922', text: '#34d399', border: '#34d39955' },
  staff: { bg: '#c084fc22', text: '#c084fc', border: '#c084fc55' },
}

export function canManageUsers(role?: UserRole): boolean {
  return role === 'fleet_manager'
}

export function canElevateRoles(role?: UserRole): boolean {
  return role === 'fleet_manager'
}

export function canEditSettings(role?: UserRole): boolean {
  return role === 'fleet_manager'
}

export function canDelete(role?: UserRole): boolean {
  return role === 'fleet_manager'
}

export function canAccessDispatch(role?: UserRole): boolean {
  return role === 'fleet_manager' || role === 'dispatcher' || role === 'staff'
}

export function canAccessMaintenance(role?: UserRole): boolean {
  return role === 'fleet_manager' || role === 'mechanic' || role === 'staff'
}

export function canAccessSafety(role?: UserRole): boolean {
  return role === 'fleet_manager' || role === 'safety_officer' || role === 'staff'
}

export function canAccessFuel(role?: UserRole): boolean {
  return role === 'fleet_manager' || role === 'dispatcher' || role === 'mechanic' || role === 'staff'
}

export function canAccessReports(role?: UserRole): boolean {
  return role === 'fleet_manager' || role === 'dispatcher' || role === 'safety_officer' || role === 'staff'
}

export function isDriver(role?: UserRole): boolean {
  return role === 'driver'
}
