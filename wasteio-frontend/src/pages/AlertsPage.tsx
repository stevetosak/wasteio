import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckDouble,
  faCircleExclamation,
  faDownload,
  faEye,
  faMagnifyingGlass,
  faRoute,
  faTriangleExclamation,
  faWifi,
} from '@fortawesome/free-solid-svg-icons'
import { useContainers } from '../hooks/useContainers'
import type { Container } from '../types/container'

type AlertBadge = 'Critical' | 'Warning' | 'System'
type AlertFilter = 'All Active' | 'Critical' | 'Overflow' | 'Reports'

interface Alert {
  id: string
  title: string
  badge: AlertBadge
  location: string
  district?: string
  fillLevel: number
}

const filters: AlertFilter[] = ['All Active', 'Critical', 'Overflow', 'Reports']
const knownDistricts = [
  { label: 'Centar', aliases: ['centar'] },
  { label: 'Karposh', aliases: ['karposh', 'karpos'] },
  { label: 'Aerodrom', aliases: ['aerodrom'] },
  { label: 'Chair', aliases: ['chair', 'cair'] },
  { label: 'Gazi Baba', aliases: ['gazi baba'] },
  { label: 'Kisela Voda', aliases: ['kisela voda'] },
  { label: 'Butel', aliases: ['butel'] },
  { label: 'Saraj', aliases: ['saraj'] },
]

function deriveDistrict(location: string) {
  const lower = location.toLowerCase()
  return knownDistricts.find(district =>
    district.aliases.some(alias => lower.includes(alias))
  )?.label ?? 'Unknown'
}

function alertFromContainer(container: Container): Alert | null {
  const location = container.address || container.name || container.id

  if (container.fillLevel >= 90) {
    return {
      id: container.id,
      title: 'Critical overflow',
      badge: 'Critical',
      location,
      district: deriveDistrict(location),
      fillLevel: container.fillLevel,
    }
  }

  if (container.fillLevel >= 70) {
    return {
      id: container.id,
      title: 'Warning: container almost full',
      badge: 'Warning',
      location,
      district: deriveDistrict(location),
      fillLevel: container.fillLevel,
    }
  }

  if (container.status === 'offline') {
    return {
      id: container.id,
      title: 'Sensor offline',
      badge: 'System',
      location,
      district: deriveDistrict(location),
      fillLevel: container.fillLevel,
    }
  }

  return null
}

function getAlertTone(alert: Alert) {
  if (alert.badge === 'Critical') {
    return {
      icon: faTriangleExclamation,
      iconClass: 'bg-red-100 text-red-600',
      badgeClass: 'bg-red-100 text-red-700',
      rowClass: 'bg-red-50/30',
      action: 'Acknowledge',
    }
  }

  if (alert.badge === 'Warning') {
    return {
      icon: faCircleExclamation,
      iconClass: 'bg-amber-100 text-amber-600',
      badgeClass: 'bg-amber-100 text-amber-700',
      rowClass: '',
      action: 'Acknowledge',
    }
  }

  return {
    icon: faWifi,
    iconClass: 'bg-gray-100 text-gray-600',
    badgeClass: 'bg-gray-100 text-gray-700',
    rowClass: '',
    action: 'Acknowledge',
  }
}

interface SummaryCardProps {
  label: string
  value: number
  icon: typeof faTriangleExclamation
  iconClass: string
  borderClass: string
  note: string
}

function SummaryCard({ label, value, icon, iconClass, borderClass, note }: SummaryCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm ${borderClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClass}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
      <p className="text-sm text-gray-500 font-medium">{note}</p>
    </div>
  )
}

export default function AlertsPage() {
  const { containers, loading, error, isDemo } = useContainers()
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('All Active')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('All')
  const [confirmAcknowledge, setConfirmAcknowledge] = useState<{
    mode: 'single' | 'visible'
    alert?: Alert
    count: number
  } | null>(null)

  const alerts = useMemo(
    () => containers.map(alertFromContainer).filter((alert): alert is Alert => alert !== null),
    [containers],
  )

  const activeAlerts = useMemo(
    () => alerts.filter(alert => !acknowledgedIds.has(alert.id)),
    [alerts, acknowledgedIds],
  )

  const availableDistricts = useMemo(() => {
    const alertDistricts = activeAlerts.map(alert => alert.district ?? 'Unknown')
    return ['All', ...Array.from(new Set(alertDistricts)).sort()]
  }, [activeAlerts])

  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return activeAlerts.filter(alert => {
      const title = alert.title.toLowerCase()
      const location = alert.location.toLowerCase()
      const district = alert.district ?? 'Unknown'

      const matchesFilter =
        activeFilter === 'All Active' ||
        (activeFilter === 'Critical' && alert.badge === 'Critical') ||
        (activeFilter === 'Overflow' && title.includes('overflow')) ||
        (activeFilter === 'Reports' && (title.includes('report') || title.includes('damaged')))

      const matchesSearch = !query || title.includes(query) || location.includes(query) || alert.id.toLowerCase().includes(query)
      const matchesDistrict =
        selectedDistrict === 'All' ||
        district === selectedDistrict ||
        location.includes(selectedDistrict.toLowerCase())

      return matchesFilter && matchesSearch && matchesDistrict
    })
  }, [activeAlerts, activeFilter, searchTerm, selectedDistrict])

  const summary = useMemo(() => ({
    critical: activeAlerts.filter(alert => alert.badge === 'Critical').length,
    warnings: activeAlerts.filter(alert => alert.badge === 'Warning').length,
    offline: activeAlerts.filter(alert => alert.badge === 'System' || alert.title.toLowerCase().includes('offline')).length,
    resolved: acknowledgedIds.size,
  }), [activeAlerts, acknowledgedIds])

  function requestAcknowledge(alert: Alert) {
    setConfirmAcknowledge({ mode: 'single', alert, count: 1 })
  }

  function requestAcknowledgeVisible() {
    setConfirmAcknowledge({ mode: 'visible', count: filteredAlerts.length })
  }

  function confirmAcknowledgeAction() {
    if (!confirmAcknowledge) return

    setAcknowledgedIds(current => {
      const next = new Set(current)
      if (confirmAcknowledge.mode === 'single' && confirmAcknowledge.alert) {
        next.add(confirmAcknowledge.alert.id)
      } else {
        filteredAlerts.forEach(alert => next.add(alert.id))
      }
      return next
    })
    setConfirmAcknowledge(null)
  }

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-gray-50">
      <header className="h-20 flex justify-between items-center px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts Center</h1>
          <p className="text-sm text-gray-500">Monitor and manage system notifications</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search alerts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block" />

          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <FontAwesomeIcon icon={faDownload} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>{error}</span>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <SummaryCard label="Critical" value={summary.critical} icon={faTriangleExclamation} iconClass="bg-red-100 text-red-600" borderClass="border-red-100" note="Needs immediate dispatch" />
            <SummaryCard label="Warnings" value={summary.warnings} icon={faCircleExclamation} iconClass="bg-amber-100 text-amber-600" borderClass="border-amber-100" note="Approaching collection threshold" />
            <SummaryCard label="Offline Sensors" value={summary.offline} icon={faWifi} iconClass="bg-gray-100 text-gray-600" borderClass="border-gray-200" note="Requires maintenance review" />
            <SummaryCard label="Resolved Today" value={summary.resolved} icon={faCheckDouble} iconClass="bg-green-100 text-green-600" borderClass="border-green-100" note="Acknowledged this session" />
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 lg:p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-semibold text-gray-500 mr-2">Filter by:</span>
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeFilter === filter
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}

                <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block" />

                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                >
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>
                      {district === 'All' ? 'District: All' : district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative md:hidden flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search alerts..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white outline-none text-sm"
                  />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                </div>
                <button
                  onClick={requestAcknowledgeVisible}
                  disabled={filteredAlerts.length === 0}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faCheckDouble} />
                  Acknowledge Visible
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Alert</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-gray-500">Loading alerts...</td>
                    </tr>
                  )}

                  {!loading && filteredAlerts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <p className="font-semibold text-gray-900">No active alerts found</p>
                        <p className="text-sm text-gray-500 mt-1">Try another filter or check whether the backend has high-fill containers.</p>
                      </td>
                    </tr>
                  )}

                  {!loading && filteredAlerts.map(alert => {
                    const tone = getAlertTone(alert)
                    return (
                      <tr key={alert.id} className={`hover:bg-gray-50 transition-colors ${tone.rowClass}`}>
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${tone.iconClass}`}>
                              <FontAwesomeIcon icon={tone.icon} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-900">{alert.title}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${tone.badgeClass}`}>
                                  {alert.badge}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Container {alert.id} is at {alert.fillLevel}% fill level.</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{alert.location}</div>
                          <div className="text-xs text-gray-500">{alert.district ?? 'Unknown'} District</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">Active</div>
                          <div className={`text-xs font-medium ${alert.badge === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>
                            Generated from {isDemo ? 'demo' : 'live'} container fill level
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/containers/${alert.id}`}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Container"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Link>
                            {alert.badge === 'Critical' && (
                              <Link
                                to="/routes"
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Add to Route"
                              >
                                <FontAwesomeIcon icon={faRoute} />
                              </Link>
                            )}
                            <button
                              onClick={() => requestAcknowledge(alert)}
                              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                            >
                              {tone.action}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {filteredAlerts.length} of {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-gray-500">{summary.resolved} acknowledged</span>
            </div>
          </section>
        </div>
      </div>

      {confirmAcknowledge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Acknowledge alert?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {confirmAcknowledge.mode === 'single' && confirmAcknowledge.alert
                    ? `This will remove ${confirmAcknowledge.alert.id} from the active alerts list.`
                    : `This will remove ${confirmAcknowledge.count} visible alerts from the active alerts list.`}
                </p>
              </div>
            </div>
            <div className="p-5 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAcknowledge(null)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAcknowledgeAction}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
