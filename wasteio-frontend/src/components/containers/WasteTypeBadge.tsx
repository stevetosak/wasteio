import type { WasteType } from '../../types/container'

const config: Record<WasteType, { label: string; className: string }> = {
  general:   { label: 'General',   className: 'bg-gray-100 text-gray-700' },
  recycling: { label: 'Recycling', className: 'bg-blue-50 text-blue-700' },
  organic:   { label: 'Organic',   className: 'bg-green-50 text-green-700' },
  hazardous: { label: 'Hazardous', className: 'bg-orange-50 text-orange-700' },
}

export default function WasteTypeBadge({ type }: { type: WasteType | undefined }) {
  const { label, className } = config[type ?? 'general']
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}