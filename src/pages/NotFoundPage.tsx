import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/Feedback'

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="card">
        <EmptyState
          title="Page not found"
          body="That route is not part of this demo workspace."
          action={<Link to="/">Back to dashboard</Link>}
        />
      </div>
    </div>
  )
}
