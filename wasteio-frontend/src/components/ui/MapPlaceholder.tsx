import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap } from '@fortawesome/free-regular-svg-icons'

interface MapPlaceholderProps {
  className?: string
  label?: string
}

export default function MapPlaceholder({ className = '', label = 'Map' }: MapPlaceholderProps) {
  return (
    <div className={`bg-gray-200 flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-gray-400">
        <FontAwesomeIcon icon={faMap} className="text-3xl" />
      </div>
      <p className="text-sm font-medium text-gray-400">{label} placeholder — map API will render here</p>
    </div>
  )
}
