import type { ReactNode } from 'react'
import { LoadingBlock } from './ui/Feedback'

export function PageGate({
  loading,
  error,
  ready,
  children,
}: {
  loading: boolean
  error: string | null
  ready: boolean
  children: ReactNode
}) {
  if (loading && !ready) {
    return (
      <div className="page">
        <LoadingBlock />
      </div>
    )
  }
  if (!ready) {
    return (
      <div className="page">
        <div className="error-banner">{error ?? 'Unable to load fleet data.'}</div>
      </div>
    )
  }
  return children
}
