import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { FleetProvider } from '../hooks/useFleet'

export function ProtectedRoute() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return (
    <FleetProvider>
      <AppShell />
    </FleetProvider>
  )
}

function AppShell() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className="app-shell">
      {open ? <div className="overlay" onClick={() => setOpen(false)} /> : null}
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="app-main">
        <Header onMenu={() => setOpen(true)} query={query} onQuery={setQuery} />
        <Outlet />
      </div>
    </div>
  )
}
