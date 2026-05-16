import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faArrowUpRightFromSquare, faPlus,
  faLocationDot, faExpand, faLocationArrow, faArrowTrendUp,
  faBatteryThreeQuarters, faRoute, faFlag, faTriangleExclamation,
  faCircleDot,
} from '@fortawesome/free-solid-svg-icons'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import MapPlaceholder from '../components/ui/MapPlaceholder'
import { Spinner } from '../components/ui/Spinner'
import { useContainerDetails } from '../hooks/useContainerDetails'
import type { FillSnapshot } from '../lib/containerApi'

const WASTE_TYPE_COLORS: Record<string, string> = {
  general: 'bg-gray-500',
  recycling: 'bg-blue-500',
  organic: 'bg-green-500',
  hazardous: 'bg-red-500',
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  recycling: 'Recycling',
  organic: 'Organic',
  hazardous: 'Hazardous',
}

function fillColor(level: number) {
  if (level >= 80) return 'bg-red-500'
  if (level >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

function formatLabel(dateStr: string, days: number): string {
  // Append T00:00:00 to avoid UTC/local shift when parsing date-only strings
  const d = new Date(`${dateStr}T00:00:00`)
  if (days <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatLastPickup(raw: string | null | undefined): string {
  if (!raw) return 'No pickups yet'
  const d = new Date(raw)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function chartData(snapshots: FillSnapshot[], days: number) {
  return snapshots.map(s => ({ day: formatLabel(s.date, days), fill: Math.round(s.fillLevel) }))
}

export default function ContainerDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { container, fillHistory, days, setDays, loading, error } = useContainerDetails(id ?? '')

  if (loading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-100">
        <Spinner size="xl" />
      </div>
    )
  }

  if (error || !container) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-100 gap-4">
        <p className="text-gray-500">{error || 'Container not found'}</p>
        <button onClick={() => navigate('/containers')} className="text-sm text-green-600 hover:text-green-500">
          Back to containers
        </button>
      </div>
    )
  }

  const fillLevel = Math.round(container.fillLevel ?? 0)
  const wasteType = container.wasteType ?? 'general'
  const dotColor = WASTE_TYPE_COLORS[wasteType] ?? 'bg-gray-400'

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto">
      {/* Header */}
      <header className="flex justify-between items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 lg:mx-6 lg:mt-6">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/containers')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 flex-shrink-0">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{container.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 truncate">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{container.address || 'No address'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center sm:gap-2">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="w-10 h-10 sm:w-auto sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-xl shadow-md text-sm font-medium hover:bg-gray-800 transition-all flex items-center justify-center sm:gap-2">
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Add to Route</span>
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 px-4 lg:px-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Card */}
            <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-300 mb-1">Current Status</h2>
                  <div className="text-5xl font-bold text-white mb-2">
                    {fillLevel}% <span className="text-xl text-gray-400 font-medium">Full</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <FontAwesomeIcon icon={faArrowTrendUp} /> Live telemetry
                  </div>
                </div>
                <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleDot} className="text-blue-400" />
                  {WASTE_TYPE_LABELS[wasteType] ?? wasteType}
                </span>
              </div>
              <div className="relative z-10 mt-8">
                <div className="flex justify-between text-sm mb-2 text-gray-400">
                  <span>Empty</span><span>Full</span>
                </div>
                <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full relative ${fillColor(fillLevel)}`} style={{ width: `${fillLevel}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Map Snippet */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Location</h2>
                <button className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <FontAwesomeIcon icon={faExpand} />
                </button>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden relative border border-gray-200">
                <MapPlaceholder className="absolute inset-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <div className="w-10 h-10 bg-gray-900 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-yellow-500">
                    <FontAwesomeIcon icon={faCircleDot} className="text-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button className="w-full bg-gray-50 text-gray-900 text-sm font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faLocationArrow} /> Navigate
                </button>
              </div>
            </div>
          </div>

          {/* Fill Level History Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Fill Level History</h2>
                <p className="text-sm text-gray-500">Daily snapshot at 10 PM</p>
              </div>
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block p-2"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>

            {fillHistory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No history yet — snapshots are taken daily at 10 PM.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData(fillHistory, days)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c0d0d" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#0c0d0d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Fill Level']} />
                  <Area type="monotone" dataKey="fill" stroke="#0c0d0d" strokeWidth={3} fill="url(#fillGrad)" dot={{ fill: '#0c0d0d', r: 5 }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Container Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Container Details</h2>
            <div className="space-y-4">
              {([
                ['Container ID', container.id],
                ['Waste Type', (
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block ${dotColor}`} />
                    {WASTE_TYPE_LABELS[wasteType] ?? wasteType}
                  </span>
                )],
                ['Capacity', container.capacityLiters ? `${container.capacityLiters} L` : '—'],
                ['Last Pickup', formatLastPickup(container.lastPickup)],
                ['Sensor Battery', (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faBatteryThreeQuarters} className={
                      (container.batteryLevel ?? 0) > 50 ? 'text-green-500' : 'text-yellow-500'
                    } />
                    {Math.round(container.batteryLevel ?? 0)}%
                  </span>
                )],
              ] as [string, React.ReactNode][]).map(([label, value], i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issues & Actions */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Reported Issues</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">0 Active</span>
            </div>

            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2 mb-6">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-gray-200" />
              <p className="text-sm">No active issues</p>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faRoute} /> Add to Active Route
              </button>
              <button className="w-full bg-white text-gray-700 font-medium py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faFlag} /> Flag Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
