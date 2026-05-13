import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faMicrophone, faFilter, faRecycle, faTrashCan,
  faPlus, faMinus, faLocationCrosshairs, faLayerGroup,
  faXmark, faTemperatureHalf, faBatteryThreeQuarters, faRoute,
} from '@fortawesome/free-solid-svg-icons'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon, type Map as LeafletMap } from 'leaflet'
import { useContainers } from '../hooks/useContainers'
import { Spinner } from '../components/ui/Spinner'
import { TelemetryStatusBadge } from '../components/ui/TelemetryStatusBadge'
import type { Container } from '../types/container'

function markerColor(fillLevel: number): string {
  if (fillLevel > 90) return '#ef4444'
  if (fillLevel >= 50) return '#eab308'
  return '#22c55e'
}

function previewBadge(fillLevel: number): string {
  if (fillLevel > 90) return 'Critical'
  if (fillLevel >= 50) return 'Requires Pickup Soon'
  return 'Low Fill'
}

function wasteEmoji(wasteType: Container['wasteType']): string {
  if (wasteType === 'recycling') return '♻'
  if (wasteType === 'organic') return '🌿'
  if (wasteType === 'hazardous') return '⚠'
  return '🗑'
}

function markerIcon(container: Container, selected: boolean) {
  const color = markerColor(container.fillLevel)
  const size = selected ? 34 : 28
  const border = selected ? '3px solid #111827' : '2px solid #ffffff'
  const shadow = selected
    ? '0 8px 18px rgba(0,0,0,0.35)'
    : '0 6px 12px rgba(0,0,0,0.25)'

  return divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${color};
      border:${border};
      box-shadow:${shadow};
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:${selected ? 15 : 13}px;
      color:white;
      transform:${selected ? 'scale(1.08)' : 'scale(1)'};
      transition:all 150ms ease;
    ">${wasteEmoji(container.wasteType)}</div>`,
  })
}

export default function MapOverviewPage() {
  const navigate = useNavigate()
  const { containers, loading, isDemo, streamStatus, streamAttempt, streamError, retryStream } = useContainers()
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'plastic' | 'general'>('all')
  const [selectedContainerId, setSelectedContainerId] = useState<string>('')
  const lastFittedKeyRef = useRef<string>('')

  const filteredContainers = useMemo(
    () =>
      containers.filter(container => {
        if (activeFilter === 'critical' && container.fillLevel <= 90) return false
        if (activeFilter === 'plastic' && container.wasteType !== 'recycling') return false
        if (activeFilter === 'general' && container.wasteType !== 'general') return false

        const query = search.trim().toLowerCase()
        if (!query) return true
        return (
          container.id.toLowerCase().includes(query) ||
          container.name?.toLowerCase().includes(query) ||
          container.address?.toLowerCase().includes(query)
        )
      }),
    [containers, search, activeFilter]
  )

  useEffect(() => {
    if (!filteredContainers.length) {
      setSelectedContainerId('')
      return
    }

    if (!selectedContainerId || !filteredContainers.some(c => c.id === selectedContainerId)) {
      setSelectedContainerId(filteredContainers[0].id)
    }
  }, [filteredContainers, selectedContainerId])

  useEffect(() => {
    if (!map || !filteredContainers.length) return

    const fitKey = filteredContainers
      .map(container => `${container.id}:${container.location.lat.toFixed(6)},${container.location.lng.toFixed(6)}`)
      .join('|')
    if (fitKey === lastFittedKeyRef.current) return
    lastFittedKeyRef.current = fitKey

    if (filteredContainers.length === 1) {
      const only = filteredContainers[0]
      map.setView([only.location.lat, only.location.lng], 15)
      return
    }

    const bounds = filteredContainers.map(container => [container.location.lat, container.location.lng] as [number, number])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
  }, [map, filteredContainers])

  const selectedContainer: Container | undefined =
    filteredContainers.find(c => c.id === selectedContainerId) ?? filteredContainers[0]

  return (
    <div className="flex-1 relative h-full flex flex-col overflow-hidden">
      {/* Map Background */}
      <MapContainer center={[41.9981, 21.4254]} zoom={13} className="absolute inset-0 z-0" ref={setMap}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredContainers.map(container => (
          <Marker
            key={container.id}
            position={[container.location.lat, container.location.lng]}
            icon={markerIcon(container, container.id === selectedContainerId)}
            eventHandlers={{
              click: () => {
                setSelectedContainerId(container.id)
                setShowPreview(true)
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{container.name}</p>
                <p className="text-gray-600">{container.address}</p>
                <p className="mt-1">Fill level: {container.fillLevel}%</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Top Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 lg:p-6 pointer-events-none flex justify-between items-start gap-3">
        {/* Search & Filters */}
        <div className="flex-1 max-w-2xl flex flex-col gap-2 pointer-events-auto min-w-0">
          <div className="relative bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex items-center p-2 border border-gray-100">
            <div className="pl-3 text-gray-400">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search containers..."
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-2 text-sm text-gray-800 placeholder-gray-400"
            />
            <button className="w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex-shrink-0 flex items-center justify-center">
              <FontAwesomeIcon icon={faMicrophone} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl shadow-sm border text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <FontAwesomeIcon icon={faFilter} className="text-gray-400" /> All
            </button>
            <span className="flex-shrink-0 hidden sm:inline-flex px-3 py-1.5 bg-white rounded-xl shadow-sm border border-gray-200 text-xs font-semibold text-gray-600 items-center">
              {isDemo ? 'Demo' : 'Live'}
            </span>
            {loading && (
              <span className="flex-shrink-0 hidden sm:inline-flex px-3 py-1.5 bg-white rounded-xl shadow-sm border border-gray-200 text-xs font-semibold text-gray-500 items-center gap-2">
                <Spinner size="xs" /> Loading…
              </span>
            )}
            {!isDemo && (
              <span className="flex-shrink-0 hidden sm:inline-flex">
                <TelemetryStatusBadge
                  status={streamStatus}
                  attempt={streamAttempt}
                  error={streamError}
                  onRetry={retryStream}
                />
              </span>
            )}
            <button
              onClick={() => setActiveFilter('critical')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl shadow-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'critical'
                  ? 'bg-red-100 border border-red-300 text-red-800'
                  : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> Critical
            </button>
            <button
              onClick={() => setActiveFilter('plastic')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl shadow-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'plastic'
                  ? 'bg-blue-50 border border-blue-300 text-blue-700'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faRecycle} className="text-blue-500" /> Plastic
            </button>
            <button
              onClick={() => setActiveFilter('general')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl shadow-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'general'
                  ? 'bg-gray-100 border border-gray-300 text-gray-800'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faTrashCan} className="text-gray-500" /> General
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col gap-3 pointer-events-auto items-end">
          <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden">
            <button
              onClick={() => map?.zoomIn()}
              className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors border-b border-gray-100"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              onClick={() => map?.zoomOut()}
              className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors border-b border-gray-100"
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <button
              onClick={() => map?.setView([41.9981, 21.4254], 13)}
              className="w-12 h-12 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <FontAwesomeIcon icon={faLocationCrosshairs} />
            </button>
          </div>
          <button className="w-12 h-12 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors">
            <FontAwesomeIcon icon={faLayerGroup} />
          </button>
        </div>
      </header>

      {/* Legend — desktop only */}
      <div className="hidden lg:block absolute bottom-6 left-8 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-4 w-48">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Map Legend</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50" />
              <span className="text-sm font-medium text-gray-700">Critical (&gt;90%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 ring-4 ring-yellow-50" />
              <span className="text-sm font-medium text-gray-700">Medium (50-90%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-50" />
              <span className="text-sm font-medium text-gray-700">Low (&lt;50%)</span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px]">
                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
              </div>
              <span className="text-sm font-medium text-gray-700">Active Trucks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container Preview Sheet */}
      {showPreview && selectedContainer && (
        <div className="absolute inset-x-3 bottom-3 lg:inset-x-auto lg:right-8 lg:bottom-6 lg:w-full lg:max-w-sm z-30 pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 lg:p-5">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  ⚠ {previewBadge(selectedContainer.fillLevel)}
                </span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{selectedContainer.name}</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 capitalize">{selectedContainer.wasteType}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationCrosshairs} className="text-gray-400" /> {selectedContainer.address}
                  </p>
                </div>
              </div>

              <div className="mb-4 sm:mb-5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-700">Fill Level</span>
                  <span className="text-lg font-bold text-yellow-600">{selectedContainer.fillLevel}%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${selectedContainer.fillLevel}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Last pickup: {selectedContainer.lastPickup ? new Date(selectedContainer.lastPickup).toLocaleString() : '—'}</p>
              </div>

              <div className="hidden sm:grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-gray-400 mb-1 text-sm"><FontAwesomeIcon icon={faTemperatureHalf} /></div>
                  <span className="block text-sm font-semibold text-gray-900">24°C</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Internal Temp</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-gray-400 mb-1 text-sm"><FontAwesomeIcon icon={faBatteryThreeQuarters} /></div>
                  <span className="block text-sm font-semibold text-gray-900">{selectedContainer.batteryLevel}%</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Sensor Battery</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate(`/containers/${selectedContainer.id}`)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Full Details
                </button>
                <button onClick={() => navigate('/routes', { state: { preselectedContainerId: selectedContainer.id } })} className="flex-[2] bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-500/20 text-sm flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faRoute} /> Start Route from Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
