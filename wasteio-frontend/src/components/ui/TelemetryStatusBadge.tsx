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
      <span className="px-2 sm:px-3 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-xs font-semibold text-amber-700 flex items-center gap-2 flex-shrink-0">
        <Spinner size="xs" className="text-amber-500" />
        <span className="hidden sm:inline">Connecting to live data…</span>
      </span>
    )
  }

  if (status === 'retrying') {
    return (
      <span className="px-2 sm:px-3 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-xs font-semibold text-amber-700 flex items-center gap-2 flex-shrink-0">
        <Spinner size="xs" className="text-amber-500" />
        <span className="hidden sm:inline">Reconnecting… ({attempt}/{MAX_RETRIES})</span>
      </span>
    )
  }

  return (
    <span className="px-2 sm:px-3 py-2 bg-red-50 rounded-xl shadow-sm border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2 flex-shrink-0">
      <span className="hidden sm:inline">{error ?? 'Stream unavailable'}</span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 underline underline-offset-2 hover:text-red-900 transition-colors"
      >
        <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
        <span className="hidden sm:inline">Try again</span>
      </button>
    </span>
  )
}
