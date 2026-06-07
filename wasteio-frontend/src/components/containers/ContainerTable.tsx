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

export type ColumnKey =
  | 'id'
  | 'name'
  | 'address'
  | 'type'
  | 'capacity'
  | 'fillLevel'
  | 'battery'
  | 'status'
  | 'lastPickup'
  | 'actions'

const DEFAULT_COLUMNS: ColumnKey[] = [
  'id', 'address', 'type', 'capacity', 'fillLevel', 'battery', 'status', 'lastPickup', 'actions',
]

interface Props {
  containers: Container[]
  onEdit?: (container: Container) => void
  onDelete?: (container: Container) => void
  columns?: ColumnKey[]
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

export default function ContainerTable({ containers, onEdit, onDelete, columns = DEFAULT_COLUMNS }: Props) {
  const navigate = useNavigate()
  const has = (col: ColumnKey) => columns.includes(col)
  const canEdit = has('actions') && !!onEdit && !!onDelete

  if (containers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-base font-medium text-gray-500">No containers match your filters</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-gray-50">
        {containers.map(container => (
          <div key={container.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {has('id') && (
                  <button
                    onClick={() => navigate(`/containers/${container.id}`)}
                    className="font-mono font-bold text-gray-900 text-sm hover:text-gray-500 transition-colors"
                  >
                    {container.id}
                  </button>
                )}
                {has('name') && !has('id') && (
                  <span className="font-medium text-gray-900 text-sm truncate">{container.name}</span>
                )}
                {has('status') && <StatusBadge status={container.status} />}
              </div>
              {has('address') && <p className="text-xs text-gray-500 truncate mb-1.5">{container.address}</p>}
              {has('fillLevel') && (
                <div className="w-32">
                  <FillLevelBar level={container.fillLevel} />
                </div>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit!(container)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faPen} className="text-xs" />
                </button>
                <button
                  onClick={() => onDelete!(container)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {has('id') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">ID</th>}
              {has('name') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Name</th>}
              {has('address') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Address</th>}
              {has('type') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Type</th>}
              {has('capacity') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Capacity</th>}
              {has('fillLevel') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Fill Level</th>}
              {has('battery') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Battery</th>}
              {has('status') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>}
              {has('lastPickup') && <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Last Pickup</th>}
              {canEdit && <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {containers.map(container => (
              <tr key={container.id} className="hover:bg-gray-50 transition-colors">
                {has('id') && (
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => navigate(`/containers/${container.id}`)}
                      className="font-mono font-bold text-gray-900 hover:text-gray-500 transition-colors"
                    >
                      {container.id}
                    </button>
                  </td>
                )}
                {has('name') && (
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <span className="text-gray-900 font-medium block truncate">{container.name}</span>
                  </td>
                )}
                {has('address') && (
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <span className="text-gray-700 block truncate">{container.address}</span>
                  </td>
                )}
                {has('type') && (
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <WasteTypeBadge type={container?.wasteType} />
                  </td>
                )}
                {has('capacity') && (
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-gray-700">{container.capacityLiters != null ? `${container.capacityLiters.toLocaleString()} L` : '—'}</span>
                  </td>
                )}
                {has('fillLevel') && (
                  <td className="px-4 py-3.5">
                    <FillLevelBar level={container.fillLevel} />
                  </td>
                )}
                {has('battery') && (
                  <td className="px-4 py-3.5">
                    <BatteryIcon level={container.batteryLevel} />
                  </td>
                )}
                {has('status') && (
                  <td className="px-4 py-3.5">
                    <StatusBadge status={container.status} />
                  </td>
                )}
                {has('lastPickup') && (
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-gray-400 text-xs">{formatDate(container.lastPickup)}</span>
                  </td>
                )}
                {canEdit && (
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit!(container)}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                      </button>
                      <button
                        onClick={() => onDelete!(container)}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
