import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { Spinner } from './Spinner'
import { MAX_RETRIES } from '../../hooks/useTelemetryStream'

type StreamStatus = 'idle' | 'connecting' | 'live' | 'retrying' | 'failed'

interface Props {
  status: StreamStatus
  attempt: number
  error: string | null
  onRetry: () => void
}

export function TelemetryStatusBadge({ status, attempt, error, onRetry }: Props) {
  if (status === 'idle' || status === 'live') return null

  if (status === 'connecting') {
    return (
      <span className="px-3 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-xs font-semibold text-amber-700 flex items-center gap-2">
        <Spinner size="xs" className="text-amber-500" />
        Connecting to live data…
      </span>
    )
  }

  if (status === 'retrying') {
    return (
      <span className="px-3 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-xs font-semibold text-amber-700 flex items-center gap-2">
        <Spinner size="xs" className="text-amber-500" />
        Reconnecting… ({attempt}/{MAX_RETRIES})
      </span>
    )
  }

  return (
    <span className="px-3 py-2 bg-red-50 rounded-xl shadow-sm border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
      {error ?? 'Stream unavailable'}
      <button
        onClick={onRetry}
        className="flex items-center gap-1 underline underline-offset-2 hover:text-red-900 transition-colors"
      >
        <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
        Try again
      </button>
    </span>
  )
}
