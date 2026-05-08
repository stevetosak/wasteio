import type { ContainerStatus } from '../../types/container'

const config: Record<ContainerStatus, { label: string; dotClass: string; className: string }> = {
  active:      { label: 'Active',      dotClass: 'bg-green-500', className: 'bg-green-50 text-green-700' },
  maintenance: { label: 'Maintenance', dotClass: 'bg-amber-500', className: 'bg-amber-50 text-amber-700' },
  offline:     { label: 'Offline',     dotClass: 'bg-gray-400',  className: 'bg-gray-100 text-gray-600' },
}

export default function StatusBadge({ status }: { status: ContainerStatus }) {
  const { label, dotClass, className } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  )
}