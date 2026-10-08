import { useToast } from '../hooks/useToast'

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} className={`toast ${toast.tone}`} onClick={() => dismiss(toast.id)}>
          <strong>{toast.title}</strong>
          {toast.description ? <div className="small muted">{toast.description}</div> : null}
        </button>
      ))}
    </div>
  )
}
