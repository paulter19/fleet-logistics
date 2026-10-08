import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'
import {
  canAccessDispatch,
  canAccessFuel,
  canAccessMaintenance,
  canAccessReports,
  canManageUsers,
  ROLE_COLORS,
  ROLE_LABELS,
} from '../utils/permissions'

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { logout, user } = useAuth()
  const { data } = useFleet()
  const navigate = useNavigate()
  const unread = data?.alerts.filter((alert) => !alert.read).length ?? 0

  const role = user?.role
  const pill = role ? ROLE_COLORS[role] : { bg: 'transparent', text: 'inherit', border: 'var(--border)' }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">HF</div>
        <div>
          <strong>Horizon Fleet</strong>
          <span>Logistics Control</span>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: pill.bg,
            border: `1px solid ${pill.border}`,
            color: pill.text,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{role ? ROLE_LABELS[role] : 'User'}</span>
          {canManageUsers(role) && <span style={{ fontSize: '0.65rem' }}>★ Admin</span>}
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">Operations</div>
        <NavLink to="/" end onClick={onNavigate}>
          Dashboard
        </NavLink>
        {canAccessDispatch(role) && (
          <>
            <NavLink to="/dispatch" onClick={onNavigate}>
              Dispatch & Trips
            </NavLink>
            <NavLink to="/loads" onClick={onNavigate}>
              Freight & Loads
            </NavLink>
          </>
        )}
        <NavLink to="/vehicles" onClick={onNavigate}>
          Vehicles & Units
        </NavLink>
        <NavLink to="/drivers" onClick={onNavigate}>
          {role === 'driver' ? 'My Driver Profile & DVIR' : 'Drivers & HOS'}
        </NavLink>

        <div className="nav-section">Assets & Service</div>
        {canAccessMaintenance(role) && (
          <NavLink to="/maintenance" onClick={onNavigate}>
            Maintenance Orders
          </NavLink>
        )}
        {canAccessFuel(role) && (
          <NavLink to="/fuel" onClick={onNavigate}>
            Fuel Logs
          </NavLink>
        )}

        <div className="nav-section">System & Team</div>
        <NavLink to="/alerts" onClick={onNavigate}>
          Alerts & Issues
          {unread > 0 ? <span className="unread-dot">{unread}</span> : null}
        </NavLink>
        {canAccessReports(role) && (
          <NavLink to="/reports" onClick={onNavigate}>
            Analytics & Reports
          </NavLink>
        )}
        <NavLink to="/settings" onClick={onNavigate}>
          {canManageUsers(role) ? 'Settings & Team RBAC' : 'Settings'}
        </NavLink>
      </nav>

      <div style={{ padding: 12, marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        <div className="small" style={{ fontWeight: 600, color: 'var(--text-bright)', padding: '0 8px 2px' }}>
          {user?.name}
        </div>
        <div className="small muted" style={{ fontSize: '0.72rem', padding: '0 8px 8px' }}>
          {user?.title}
        </div>
        <button
          className="nav-btn"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
