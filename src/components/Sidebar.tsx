import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/dispatch', label: 'Dispatch' },
  { to: '/loads', label: 'Loads' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/fuel', label: 'Fuel' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { logout, user } = useAuth()
  const { data } = useFleet()
  const navigate = useNavigate()
  const unread = data?.alerts.filter((alert) => !alert.read).length ?? 0

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">HF</div>
        <div>
          <strong>Horizon Fleet</strong>
          <span>Logistics control</span>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-section">Operations</div>
        {links.slice(0, 5).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onNavigate}>
            {link.label}
          </NavLink>
        ))}
        <div className="nav-section">Assets</div>
        {links.slice(5, 7).map((link) => (
          <NavLink key={link.to} to={link.to} onClick={onNavigate}>
            {link.label}
          </NavLink>
        ))}
        <div className="nav-section">Company</div>
        {links.slice(7).map((link) => (
          <NavLink key={link.to} to={link.to} onClick={onNavigate}>
            {link.label}
            {link.to === '/alerts' && unread > 0 ? <span className="unread-dot">{unread}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: 12 }}>
        <div className="small muted" style={{ padding: '0 8px 8px' }}>
          {user?.name}
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
