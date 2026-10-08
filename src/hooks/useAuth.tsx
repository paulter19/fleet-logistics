import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoUsers } from '../data/seed'
import {
  getStoredSession,
  loginDemo,
  loginWithPassword,
  logout as logoutSession,
  switchUserSession,
  type AuthSession,
} from '../services/authService'
import { getState } from '../services/store'
import type { User, UserRole } from '../types'

interface AuthContextValue {
  user: User | null
  ready: boolean
  availableUsers: User[]
  login: (email: string, password: string) => Promise<void>
  demoLogin: (roleOrId?: UserRole | string) => Promise<void>
  switchPersona: (user: User) => void
  refreshSession: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const [ready] = useState(true)

  // Listen for storage events across tabs or local mutations
  const refreshSession = () => {
    const next = getStoredSession()
    setSession(next)
  }

  useEffect(() => {
    const handler = () => refreshSession()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const availableUsers = getState().users || demoUsers

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      ready,
      availableUsers,
      login: async (email, password) => {
        const next = await loginWithPassword(email, password)
        setSession(next)
      },
      demoLogin: async (roleOrId) => {
        const next = await loginDemo(roleOrId)
        setSession(next)
      },
      switchPersona: (targetUser) => {
        const next = switchUserSession(targetUser)
        setSession(next)
      },
      refreshSession,
      logout: () => {
        logoutSession()
        setSession(null)
      },
    }),
    [ready, session, availableUsers],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
