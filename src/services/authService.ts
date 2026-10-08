import { demoUser } from '../data/seed'
import type { User } from '../types'
import { wait } from '../utils/misc'

const KEY = 'fleetlogistics.auth.v1'

export interface AuthSession {
  user: User
  token: string
  loggedInAt: string
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export async function loginWithPassword(email: string, password: string): Promise<AuthSession> {
  await wait(350)
  const normalized = email.trim().toLowerCase()
  const demoMatch =
    normalized === demoUser.email && (password === 'demo123' || password === 'demo')
  if (!demoMatch) {
    throw new Error('Invalid email or password. Use Demo Login for this preview.')
  }
  return persistSession()
}

export async function loginDemo(): Promise<AuthSession> {
  await wait(180)
  return persistSession()
}

export function logout(): void {
  localStorage.removeItem(KEY)
}

function persistSession(): AuthSession {
  const session: AuthSession = {
    user: demoUser,
    token: 'demo-local-session',
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}
