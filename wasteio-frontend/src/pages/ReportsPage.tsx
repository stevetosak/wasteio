import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faCircleCheck,
  faMagnifyingGlass,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import StatusBadge from '../components/containers/StatusBadge'
import WasteTypeBadge from '../components/containers/WasteTypeBadge'
import { useContainers } from '../hooks/useContainers'
import { Spinner } from '../components/ui/Spinner'
import type { Container, WasteType } from '../types/container'

const DATE_RANGES = ['Today', 'This Week', 'This Month', 'All'] as const
type DateRange = typeof DATE_RANGES[number]

const WASTE_TYPES: WasteType[] = ['general', 'recycling', 'organic', 'hazardous']

const WASTE_LABELS: Record<WasteType, string> = {
  general: 'General',
  recycling: 'Recycling',
  organic: 'Organic',
  hazardous: 'Hazardous',
}

const numberFormat = new Intl.NumberFormat('en-US')


function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value))
}

function formatLiters(value: number): string {
  return `${formatNumber(value)} L`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function safeFillLevel(container: Container): number {
  return clamp(Math.round(container.fillLevel ?? 0), 0, 100)
}

function safeBatteryLevel(container: Container): number {
  return clamp(Math.round(container.batteryLevel ?? 0), 0, 100)
}

function capacity(container: Container): number {
  return container.capacityLiters ?? 0
}

function currentLoad(container: Container): number {
  return capacity(container) * safeFillLevel(container) / 100
}

function districtFromAddress(address?: string): string {
  if (!address) return 'Unknown'
  const parts = address.split(',').map(part => part.trim()).filter(Boolean)
  return parts.at(-1) ?? 'Unknown'
}

function startDateForRange(range: DateRange): Date | null {
  if (range === 'All') return null
  const now = new Date()
  if (range === 'Today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return start
  }
  if (range === 'This Week') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return start
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function hasPickupInRange(container: Container, range: DateRange): boolean {
  if (!container.lastPickup) return false
  const pickupDate = new Date(container.lastPickup)
  if (Number.isNaN(pickupDate.getTime())) return false
  const start = startDateForRange(range)
  if (!start) return true
  return pickupDate >= start && pickupDate <= new Date()
}

function fillClass(level: number): string {
  if (level >= 80) return 'bg-red-500'
  if (level >= 60) return 'bg-amber-500'
  return 'bg-green-500'
}

function containerRiskScore(container: Container): number {
  let score = safeFillLevel(container)
  if (container.status === 'offline') score += 35
  if (container.status === 'maintenance') score += 18
  if (safeBatteryLevel(container) <= 25) score += 14
  return score
}

function riskTone(container: Container): { bar: string; label: string; text: string; bg: string } {
  if (container.status === 'offline' || safeFillLevel(container) >= 90) {
    return { bar: 'bg-red-500', label: 'Critical', text: 'text-red-700', bg: 'bg-red-50' }
  }
  if (safeFillLevel(container) >= 80) {
    return { bar: 'bg-amber-500', label: 'Pickup due', text: 'text-amber-700', bg: 'bg-amber-50' }
  }
  if (safeBatteryLevel(container) <= 25) {
    return { bar: 'bg-amber-500', label: 'Low battery', text: 'text-amber-700', bg: 'bg-amber-50' }
  }
  if (container.status === 'maintenance') {
    return { bar: 'bg-gray-400', label: 'Maintenance', text: 'text-gray-700', bg: 'bg-gray-100' }
  }
  return { bar: 'bg-gray-300', label: 'Monitor', text: 'text-gray-600', bg: 'bg-gray-100' }
}

function rowAccent(container: Container): string {
  if (container.status === 'offline') return 'bg-gray-700'
  if (container.status === 'maintenance') return 'bg-gray-400'
  const fill = safeFillLevel(container)
  if (fill >= 90) return 'bg-red-500'
  if (fill >= 80) return 'bg-amber-500'
  if (fill >= 60) return 'bg-amber-400'
  return 'bg-green-500'
}

function formatLastPickup(raw?: string): string {
  if (!raw) return 'No pickup'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'No pickup'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function relativeDays(raw?: string): string | null {
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'today'
  if (diff === 1) return '1d ago'
  if (diff < 30) return `${diff}d ago`
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`
  return `${Math.floor(diff / 365)}y ago`
}

function containerName(container: Container): string {
  return container.name?.trim() || container.id
}


export default function ReportsPage() {
  const { containers, loading, error } = useContainers()

  const [activeRange, setActiveRange] = useState<DateRange>('This Week')
  const [containerSearch, setContainerSearch] = useState('')

  const summary = useMemo(() => {
    const totalCapacity = containers.reduce((sum, container) => sum + capacity(container), 0)
    const totalLoad = containers.reduce((sum, container) => sum + currentLoad(container), 0)
    const avgFill = containers.length
        ? Math.round(containers.reduce((sum, container) => sum + safeFillLevel(container), 0) / containers.length)
        : 0
    const avgBattery = containers.length
        ? Math.round(containers.reduce((sum, container) => sum + safeBatteryLevel(container), 0) / containers.length)
        : 0
    const utilization = totalCapacity > 0 ? Math.round(totalLoad / totalCapacity * 100) : 0
    const pickupCandidates = containers.filter(container => container.status === 'active' && safeFillLevel(container) >= 80)
    const critical = containers.filter(container => safeFillLevel(container) >= 90)
    const lowBattery = containers.filter(container => safeBatteryLevel(container) <= 25)
    const offline = containers.filter(container => container.status === 'offline')
    const maintenance = containers.filter(container => container.status === 'maintenance')
    const sensorRisk = containers.filter(container => container.status === 'offline' || safeBatteryLevel(container) <= 25)
    const active = containers.filter(container => container.status === 'active')
    const pickupsInRange = containers.filter(container => hasPickupInRange(container, activeRange))
    const optimal = containers.filter(container => container.status === 'active' && safeFillLevel(container) < 60)
    const monitor = containers.filter(container => container.status === 'active' && safeFillLevel(container) >= 60 && safeFillLevel(container) < 80)
    const readiness = Math.round(clamp(
        100 - critical.length * 8 - sensorRisk.length * 7 - pickupCandidates.length * 2,
        0,
        100
    ))

    return {
      totalCapacity, totalLoad, avgFill, avgBattery, utilization,
      pickupCandidates, critical, lowBattery, offline, maintenance,
      sensorRisk, active, pickupsInRange, optimal, monitor, readiness,
    }
  }, [activeRange, containers])

  const pressureData = useMemo(() => [
    { level: '0-49%', containers: containers.filter(container => safeFillLevel(container) < 50).length },
    { level: '50-79%', containers: containers.filter(container => safeFillLevel(container) >= 50 && safeFillLevel(container) < 80).length },
    { level: '80-89%', containers: containers.filter(container => safeFillLevel(container) >= 80 && safeFillLevel(container) < 90).length },
    { level: '90-100%', containers: containers.filter(container => safeFillLevel(container) >= 90).length },
  ], [containers])

  const wasteTypeRows = useMemo(() => WASTE_TYPES.map(type => {
    const matching = containers.filter(container => (container.wasteType ?? 'general') === type)
    const avgFill = matching.length
        ? Math.round(matching.reduce((sum, container) => sum + safeFillLevel(container), 0) / matching.length)
        : 0
    const load = matching.reduce((sum, container) => sum + currentLoad(container), 0)
    return { type, label: WASTE_LABELS[type], containers: matching.length, avgFill, load }
  }), [containers])

  const priorityContainers = useMemo(() => containers
      .filter(container =>
          safeFillLevel(container) >= 80 ||
          container.status !== 'active' ||
          safeBatteryLevel(container) <= 25
      )
      .sort((a, b) => containerRiskScore(b) - containerRiskScore(a))
      .slice(0, 6), [containers])

  const filteredContainers = useMemo(() => {
    const query = containerSearch.trim().toLowerCase()
    const sorted = [...containers].sort((a, b) => containerRiskScore(b) - containerRiskScore(a))
    if (!query) return sorted

    return sorted.filter(container => {
      const wasteType = container.wasteType ?? 'general'
      return [
        container.id,
        container.name ?? '',
        container.address ?? '',
        districtFromAddress(container.address),
        WASTE_LABELS[wasteType],
        container.status,
      ].some(value => value.toLowerCase().includes(query))
    })
  }, [containerSearch, containers])

  const capacityRemaining = Math.max(summary.totalCapacity - summary.totalLoad, 0)

  const totalForBar = containers.length || 1
  const statusSegments = [
    { label: 'Optimal', count: summary.optimal.length, color: 'bg-green-500' },
    { label: 'Monitor', count: summary.monitor.length, color: 'bg-amber-400' },
    { label: 'Pickup Due', count: summary.pickupCandidates.length, color: 'bg-red-500' },
    { label: 'Maintenance', count: summary.maintenance.length, color: 'bg-gray-500' },
    { label: 'Offline', count: summary.offline.length, color: 'bg-gray-700' },
  ]

  const inventoryStats = useMemo(() => {
    const critical = filteredContainers.filter(c => safeFillLevel(c) >= 90 || c.status === 'offline').length
    const warning = filteredContainers.filter(c => {
      const fill = safeFillLevel(c)
      return (fill >= 80 && fill < 90) || safeBatteryLevel(c) <= 25 || c.status === 'maintenance'
    }).length
    const healthy = filteredContainers.length - critical - warning
    return { critical, warning, healthy }
  }, [filteredContainers])

  const kpiMetrics = [
    {
      label: 'Total Containers',
      value: formatNumber(containers.length),
      detail: `${formatNumber(summary.active.length)} active`,
      accent: 'text-gray-900',
    },
    {
      label: 'Avg Fill',
      value: `${summary.avgFill}%`,
      detail: formatLiters(summary.totalLoad),
      accent: summary.avgFill >= 80 ? 'text-red-600' : summary.avgFill >= 60 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: 'Pickup Due',
      value: formatNumber(summary.pickupCandidates.length),
      detail: `${summary.critical.length} critical`,
      accent: summary.pickupCandidates.length > 0 ? 'text-amber-600' : 'text-gray-900',
    },
    {
      label: 'Sensor Risk',
      value: formatNumber(summary.sensorRisk.length),
      detail: `${summary.offline.length} offline`,
      accent: summary.sensorRisk.length > 0 ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: 'Avg Battery',
      value: `${summary.avgBattery}%`,
      detail: `${summary.lowBattery.length} low`,
      accent: summary.avgBattery <= 30 ? 'text-amber-600' : 'text-gray-900',
    },
  ]

  const cardBase = 'bg-white border border-gray-200 rounded-2xl transition-all duration-200 hover:border-gray-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]'

  if (loading && containers.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
      <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-hidden">
        <header className="min-h-20 flex flex-col sm:flex-row justify-between sm:items-center gap-3 px-4 py-4 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">
                Fleet overview
              </span>
              <span className="text-[11px] text-gray-300">·</span>
              <span className="text-[11px] text-gray-400 tabular-nums">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              {DATE_RANGES.map(range => (
                  <button
                      key={range}
                      onClick={() => setActiveRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          activeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {range}
                  </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5">
            <div className="lg:hidden flex items-center bg-white border border-gray-200 rounded-lg p-1 overflow-x-auto">
              {DATE_RANGES.map(range => (
                  <button
                      key={range}
                      onClick={() => setActiveRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                          activeRange === range ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
                      }`}
                  >
                    {range}
                  </button>
              ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  <span>{error}</span>
                </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300">
              {kpiMetrics.map(metric => (
                  <div key={metric.label} className="group bg-white p-4 lg:p-5 transition-colors hover:bg-gray-50/60 cursor-default relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">{metric.label}</p>
                    <p className={`text-2xl lg:text-3xl font-bold tabular-nums tracking-tight mt-2 ${metric.accent}`}>
                      {metric.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1.5 truncate">{metric.detail}</p>
                  </div>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)] gap-5">
              <div className="bg-gray-900 text-white rounded-2xl p-6 lg:p-7 relative overflow-hidden transition-all duration-200 hover:shadow-lg group/hero">
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                />
                <div
                    className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20 pointer-events-none transition-opacity duration-500 group-hover/hero:opacity-30"
                    style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-7">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-[0.18em]">
                          Fleet capacity
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-6xl lg:text-7xl font-bold tabular-nums tracking-tighter leading-none">
                          {summary.utilization}
                        </span>
                        <span className="text-3xl font-light text-gray-500">%</span>
                        <span className="text-sm text-gray-400 ml-2">in use</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-3">
                        <span className="font-semibold text-white tabular-nums">{formatLiters(summary.totalLoad)}</span>
                        <span className="text-gray-600"> occupied · </span>
                        <span className="tabular-nums text-gray-300">{formatLiters(capacityRemaining)}</span>
                        <span className="text-gray-600"> available</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-2">Readiness</p>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-3xl font-bold tabular-nums leading-none">{summary.readiness}</span>
                        <span className="text-base text-gray-600 tabular-nums">/100</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center h-2.5 rounded-full overflow-hidden bg-white/5">
                      {statusSegments.map(seg => seg.count > 0 && (
                          <div
                              key={seg.label}
                              className={`${seg.color} transition-all duration-300 hover:brightness-125`}
                              style={{ width: `${seg.count / totalForBar * 100}%`, height: '100%' }}
                              title={`${seg.label}: ${seg.count}`}
                          />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                      {statusSegments.map(seg => (
                          <div key={seg.label} className="flex items-center gap-2 group/seg cursor-default">
                            <span className={`w-2 h-2 rounded-sm ${seg.color} transition-transform group-hover/seg:scale-125`} />
                            <span className="text-xs text-gray-400 group-hover/seg:text-gray-300 transition-colors">{seg.label}</span>
                            <span className="text-xs font-bold tabular-nums text-white">{formatNumber(seg.count)}</span>
                          </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-7 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em]">Pickups · {activeRange}</p>
                      <p className="text-xl font-bold tabular-nums mt-1.5">{formatNumber(summary.pickupsInRange.length)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em]">Avg Battery</p>
                      <p className="text-xl font-bold tabular-nums mt-1.5">{summary.avgBattery}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em]">Total Capacity</p>
                      <p className="text-xl font-bold tabular-nums mt-1.5">{formatLiters(summary.totalCapacity)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardBase} overflow-hidden flex flex-col`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Critical Alerts</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{priorityContainers.length} active issues</p>
                  </div>
                  {priorityContainers.length > 0 && (
                      <span className="inline-flex items-center justify-center text-[11px] font-bold w-6 h-6 rounded-full bg-red-50 text-red-600 tabular-nums ring-4 ring-red-50/40">
                        {priorityContainers.length}
                      </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100 overflow-y-auto" style={{ maxHeight: 420 }}>
                  {priorityContainers.length === 0 ? (
                      <div className="py-12 text-center px-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3">
                          <FontAwesomeIcon icon={faCircleCheck} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">All clear</p>
                        <p className="text-xs text-gray-500 mt-1">Fleet within normal range.</p>
                      </div>
                  ) : priorityContainers.map(container => {
                    const tone = riskTone(container)
                    return (
                        <Link
                            key={container.id}
                            to={`/containers/${container.id}`}
                            className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors relative"
                        >
                          <div className={`w-1 self-stretch rounded-full ${tone.bar} transition-all duration-200 group-hover:w-1.5`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-gray-950 transition-colors">{containerName(container)}</p>
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[11px] font-semibold ${tone.text}`}>{tone.label}</span>
                              <span className="text-[11px] text-gray-300">·</span>
                              <span className="text-[11px] text-gray-500 truncate">{districtFromAddress(container.address)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900 tabular-nums">{safeFillLevel(container)}%</p>
                            <p className="text-[10px] text-gray-400">{formatLastPickup(container.lastPickup)}</p>
                          </div>
                        </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className={`${cardBase} p-5`}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fill Distribution</h3>
                  <p className="text-xs text-gray-500 mt-1">Containers by fill band</p>
                </div>
                {loading && <Spinner size="sm" />}
              </div>
              {containers.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                    No containers to chart.
                  </div>
              ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={pressureData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pressureGradModern" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="level" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                          cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          formatter={value => [formatNumber(Number(value)), 'Containers']}
                      />
                      <Area type="monotone" dataKey="containers" stroke="#22c55e" strokeWidth={2.5} fill="url(#pressureGradModern)" dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }} />
                    </AreaChart>
                  </ResponsiveContainer>
              )}
            </section>

            <section className={`${cardBase} overflow-hidden`}>
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Container Inventory</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-gray-700 tabular-nums">{filteredContainers.length}</span>
                        <span className="text-gray-400"> of {containers.length} shown</span>
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[11px] text-gray-600 tabular-nums">{inventoryStats.healthy} healthy</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[11px] text-gray-600 tabular-nums">{inventoryStats.warning} warning</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[11px] text-gray-600 tabular-nums">{inventoryStats.critical} critical</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full lg:w-80">
                    <input
                        type="text"
                        placeholder="Search by name, district, type..."
                        value={containerSearch}
                        onChange={event => setContainerSearch(event.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-all"
                    />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    {containerSearch && (
                        <button
                            onClick={() => setContainerSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded transition-colors"
                        >
                          CLEAR
                        </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                {filteredContainers.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-300 text-lg" />
                        <p className="text-sm text-gray-500 font-medium">No containers match this search</p>
                        <p className="text-xs text-gray-400">Try a different keyword or clear the filter.</p>
                      </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredContainers.map(container => {
                        const fill = safeFillLevel(container)
                        const battery = safeBatteryLevel(container)
                        const batteryClass = battery <= 25 ? 'bg-red-500' : battery <= 50 ? 'bg-amber-500' : 'bg-green-500'
                        const accent = rowAccent(container)
                        const tone = riskTone(container)
                        const pickupRel = relativeDays(container.lastPickup)

                        return (
                            <Link
                                key={container.id}
                                to={`/containers/${container.id}`}
                                className="group relative min-h-[184px] rounded-xl border border-gray-200 bg-white p-4 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
                            >
                              <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 truncate">{containerName(container)}</h4>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px] text-gray-300 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{container.id}</p>
                                </div>
                                <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.bg} ${tone.text}`}>
                                  {tone.label}
                                </span>
                              </div>

                              <p className="mt-3 text-xs text-gray-500 truncate">{container.address || 'No address'}</p>

                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <WasteTypeBadge type={container.wasteType} />
                                <StatusBadge status={container.status} />
                              </div>

                              <div className="mt-4 space-y-3">
                                <div>
                                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                    <span>Fill</span>
                                    <span className="font-semibold text-gray-800 tabular-nums">{fill}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className={`${fillClass(fill)} h-full rounded-full transition-all`} style={{ width: `${fill}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                    <span>Battery</span>
                                    <span className="font-semibold text-gray-800 tabular-nums">{battery}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className={`${batteryClass} h-full rounded-full transition-all`} style={{ width: `${battery}%` }} />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Capacity</p>
                                  <p className="text-sm font-semibold text-gray-800 tabular-nums">
                                    {capacity(container) > 0 ? formatLiters(capacity(container)) : '—'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Pickup</p>
                                  <p className="text-sm font-semibold text-gray-800">{formatLastPickup(container.lastPickup)}</p>
                                  {pickupRel && <p className="text-[10px] text-gray-400">{pickupRel}</p>}
                                </div>
                              </div>
                            </Link>
                        )
                      })}
                    </div>
                )}
              </div>
            </section>

            <section className={`${cardBase} p-5 pb-4`}>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Waste Stream Mix</h3>
                <p className="text-xs text-gray-500 mt-1">Fill levels by waste type</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {wasteTypeRows.map(row => (
                    <div key={row.type} className="group/wrow -mx-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <WasteTypeBadge type={row.type} />
                        <span className="text-base font-bold text-gray-900 tabular-nums">{row.avgFill}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div
                            className={`${fillClass(row.avgFill)} h-full rounded-full transition-all duration-300 group-hover/wrow:brightness-110`}
                            style={{ width: `${row.avgFill}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{row.containers} containers</span>
                        <span className="tabular-nums">{formatLiters(row.load)}</span>
                      </div>
                    </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
  )
}
