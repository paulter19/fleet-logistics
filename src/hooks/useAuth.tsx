import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getStoredSession, loginDemo, loginWithPassword, logout as logoutSession, type AuthSession } from '../services/authService'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  demoLogin: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const [ready] = useState(true)

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      ready,
      login: async (email, password) => {
        const next = await loginWithPassword(email, password)
        setSession(next)
      },
      demoLogin: async () => {
        const next = await loginDemo()
        setSession(next)
      },
      logout: () => {
        logoutSession()
        setSession(null)
      },
    }),
    [ready, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
