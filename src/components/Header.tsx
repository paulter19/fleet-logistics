import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'
import { initials } from '../utils/format'
import { ROLE_COLORS, ROLE_LABELS } from '../utils/permissions'

export function Header({
  onMenu,
  query,
  onQuery,
}: {
  onMenu: () => void
  query: string
  onQuery: (value: string) => void
}) {
  const { user, availableUsers, switchPersona, logout } = useAuth()
  const { data } = useFleet()
  const navigate = useNavigate()
  const unread = data?.alerts.some((alert) => !alert.read)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('horizon_theme') as 'light' | 'dark') || 'light'
  })
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('horizon_theme', theme)
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const roleStyle = user?.role
    ? ROLE_COLORS[user.role]
    : { bg: 'transparent', text: 'inherit', border: 'var(--border)' }

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation">
        ☰
      </button>
      <label className="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" />
        </svg>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search units, drivers, loads…"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`)
          }}
        />
      </label>
      <div className="topbar-actions">
        {/* Quick Role Persona Switcher */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowPersonaMenu((v) => !v)}
            title="Switch User Role Persona for Testing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: roleStyle.bg,
              color: roleStyle.text,
              border: `1px solid ${roleStyle.border}`,
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <span>👤 {user ? ROLE_LABELS[user.role] : 'Persona'}</span>
            <span style={{ fontSize: '0.65rem' }}>▼</span>
          </button>

          {showPersonaMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 250,
                background: 'var(--surface-raised, #1e293b)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                zIndex: 100,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '6px 8px 4px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Switch Active Role Persona
              </div>
              {availableUsers.map((u) => {
                const isCurrent = u.id === user?.id
                const pill = ROLE_COLORS[u.role]
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchPersona(u)
                      setShowPersonaMenu(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isCurrent ? 'var(--surface-sunken)' : 'transparent',
                      border: isCurrent ? `1px solid ${pill.border}` : '1px solid transparent',
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isCurrent ? 700 : 500, color: 'var(--text-bright)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.title}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: pill.bg,
                        color: pill.text,
                        border: `1px solid ${pill.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ROLE_LABELS[u.role].split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <Link to="/alerts" className="icon-btn" aria-label="Alerts" title="Alerts & Incidents">
          ⚑{unread ? <span className="ping" /> : null}
        </Link>
        <div className="user-chip">
          <div className="avatar">{initials(user?.name ?? 'HF')}</div>
          <span>
            {user?.name}
            <small>{user?.title}</small>
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

