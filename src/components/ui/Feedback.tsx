import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  busy?: boolean
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-h">
          <h2>{title}</h2>
        </div>
        <div className="modal-b">
          <p className="muted">{body}</p>
        </div>
        <div className="modal-f">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function LoadingBlock() {
  return (
    <div className="card card-pad">
      <div className="stack">
        <div className="skeleton" style={{ width: '40%' }} />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" style={{ width: '70%' }} />
      </div>
    </div>
  )
}
