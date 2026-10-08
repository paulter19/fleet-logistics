import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFleet } from '../hooks/useFleet'
import { initials } from '../utils/format'

export function Header({
  onMenu,
  query,
  onQuery,
}: {
  onMenu: () => void
  query: string
  onQuery: (value: string) => void
}) {
  const { user, logout } = useAuth()
  const { data } = useFleet()
  const navigate = useNavigate()
  const unread = data?.alerts.some((alert) => !alert.read)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('horizon_theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('horizon_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

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

