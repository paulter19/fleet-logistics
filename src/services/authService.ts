import { demoUser, demoUsers } from '../data/seed'
import type { User, UserRole } from '../types'
import { wait } from '../utils/misc'
import { getState } from './store'

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
    const session = JSON.parse(raw) as AuthSession
    // Sync with current store in case the user's role or status was modified
    const currentUsers = getState().users || demoUsers
    const matching = currentUsers.find((u) => u.id === session.user.id || u.email === session.user.email)
    if (matching) {
      session.user = matching
    }
    return session
  } catch {
    return null
  }
}

export async function loginWithPassword(email: string, password: string): Promise<AuthSession> {
  await wait(350)
  const normalized = email.trim().toLowerCase()
  const users = getState().users || demoUsers
  const user = users.find((u) => u.email.toLowerCase() === normalized)

  if (!user) {
    throw new Error('No user found with this email. Try demo credentials or Demo Login.')
  }

  if (user.status === 'suspended') {
    throw new Error('This account has been suspended by the Fleet Operations Manager.')
  }

  // In mock environment, accept demo password or standard credentials
  const validPass = password === 'demo123' || password === 'demo' || password.length >= 4
  if (!validPass) {
    throw new Error('Invalid password. Enter "demo123" for demo accounts.')
  }

  return persistSession(user)
}

export async function loginDemo(roleOrId?: UserRole | string): Promise<AuthSession> {
  await wait(180)
  const users = getState().users || demoUsers
  let targetUser = users[0] || demoUser

  if (roleOrId) {
    const byId = users.find((u) => u.id === roleOrId)
    const byRole = users.find((u) => u.role === roleOrId)
    if (byId) targetUser = byId
    else if (byRole) targetUser = byRole
  }

  return persistSession(targetUser)
}

export function switchUserSession(user: User): AuthSession {
  return persistSession(user)
}

export function logout(): void {
  localStorage.removeItem(KEY)
}

function persistSession(user: User): AuthSession {
  const session: AuthSession = {
    user,
    token: `demo-session-${user.id}-${Date.now()}`,
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}
