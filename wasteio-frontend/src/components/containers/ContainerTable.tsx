import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, faTrash,
  faBatteryFull, faBatteryThreeQuarters, faBatteryHalf, faBatteryQuarter,
} from '@fortawesome/free-solid-svg-icons'
import type { Container } from '../../types/container'
import WasteTypeBadge from './WasteTypeBadge'
import StatusBadge from './StatusBadge'
import FillLevelBar from './FillLevelBar'

interface Props {
  containers: Container[]
  onEdit: (container: Container) => void
  onDelete: (container: Container) => void
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function BatteryIcon({ level }: { level: number }) {
  const icon =
    level >= 75 ? faBatteryFull :
    level >= 50 ? faBatteryThreeQuarters :
    level >= 25 ? faBatteryHalf :
    faBatteryQuarter

  const color =
    level >= 50 ? 'text-green-500' :
    level >= 25 ? 'text-yellow-500' :
    'text-red-500'

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
      <FontAwesomeIcon icon={icon} className={color} />
      {level}%
    </span>
  )
}

export default function ContainerTable({ containers, onEdit, onDelete }: Props) {
  const navigate = useNavigate()

  if (containers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-base font-medium text-gray-500">No containers match your filters</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['ID', 'Address', 'Type', 'Capacity', 'Fill Level', 'Battery', 'Status', 'Last Pickup', ''].map((h, i) => (
              <th
                key={i}
                className={`text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 ${
                  i === 2 ? 'hidden md:table-cell' :
                  i === 3 ? 'hidden lg:table-cell' :
                  i === 5 ? 'hidden xl:table-cell' :
                  i === 7 ? 'hidden lg:table-cell' :
                  i === 8 ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {containers.map(container => (
            <tr key={container.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3.5">
                <button
                  onClick={() => navigate(`/containers/${container.id}`)}
                  className="font-mono font-bold text-gray-900 hover:text-gray-500 transition-colors"
                >
                  {container.id}
                </button>
              </td>
              <td className="px-4 py-3.5 max-w-[200px]">
                <span className="text-gray-700 block truncate">{container.address}</span>
              </td>
              <td className="px-4 py-3.5 hidden md:table-cell">
                <WasteTypeBadge type={container?.wasteType} />
              </td>
              <td className="px-4 py-3.5 hidden lg:table-cell">
                <span className="text-gray-700">{container.capacityLiters != null ? `${container.capacityLiters.toLocaleString()} L` : '—'}</span>
              </td>
              <td className="px-4 py-3.5">
                <FillLevelBar level={container.fillLevel} />
              </td>
              <td className="px-4 py-3.5 hidden xl:table-cell">
                <BatteryIcon level={container.batteryLevel} />
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={container.status} />
              </td>
              <td className="px-4 py-3.5 hidden lg:table-cell">
                <span className="text-gray-400 text-xs">{formatDate(container.lastPickup)}</span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(container)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </button>
                  <button
                    onClick={() => onDelete(container)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}