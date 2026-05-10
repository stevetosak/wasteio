import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFan } from '@fortawesome/free-solid-svg-icons'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-4xl',
}

export function Spinner({ size = 'md', className = '' }: { size?: SpinnerSize; className?: string }) {
  return (
    <FontAwesomeIcon
      icon={faFan}
      role="status"
      aria-label="Loading"
      className={`animate-spin text-green-500 ${sizeClasses[size]} ${className}`}
    />
  )
}
