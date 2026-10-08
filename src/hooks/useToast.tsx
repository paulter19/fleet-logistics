import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ToastMessage, ToastTone } from '../types'
import { createId } from '../utils/misc'

interface ToastContextValue {
  toasts: ToastMessage[]
  notify: (tone: ToastTone, title: string, description?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = createId('toast')
      setToasts((current) => [...current, { id, tone, title, description }])
      window.setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [dismiss, notify, toasts])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
