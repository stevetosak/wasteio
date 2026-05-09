import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faTruckFast, faPlay, faPlus, faMinus,
  faLocationCrosshairs, faCheck, faTrashCan, faRoute, faFileExport,
  faLocationArrow, faSpinner, faFlag,
} from '@fortawesome/free-solid-svg-icons'
import { MapContainer, Marker, Popup, TileLayer, Polyline } from 'react-leaflet'
import { divIcon, type Map as LeafletMap } from 'leaflet'
import { useContainers } from '../hooks/useContainers'
import type { Container } from '../types/container'

function markerColor(fillLevel: number): string {
  if (fillLevel > 90) return '#ef4444'
  if (fillLevel >= 50) return '#eab308'
  return '#22c55e'
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
  const border = selected ? '3px solid #16a34a' : '2px solid #ffffff'
  const shadow = selected
    ? '0 8px 18px rgba(22,163,74,0.35)'
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

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2)
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function nearestNeighborOrder(containers: Container[], start?: Container): Container[] {
  if (containers.length <= 1) return containers
  const unvisited = [...containers]
  const ordered: Container[] = []

  if (start) {
    ordered.push(start)
    const idx = unvisited.findIndex(c => c.id === start.id)
    if (idx !== -1) unvisited.splice(idx, 1)
  } else {
    ordered.push(unvisited.shift()!)
  }

  while (unvisited.length > 0) {
    const last = ordered[ordered.length - 1]
    let nearest = 0
    let minDist = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversine(last.location, unvisited[i].location)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }

    ordered.push(unvisited.splice(nearest, 1)[0])
  }

  return ordered
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function estimateTime(km: number, stops: number): string {
  const drivingMinutes = (km / 30) * 60
  const stopMinutes = stops * 3
  const total = Math.round(drivingMinutes + stopMinutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function fetchRoute(waypoints: Container[]): Promise<{
  path: [number, number][]
  distanceKm: number
  durationSec: number
}> {
  const coords = waypoints.map(wp => `${wp.location.lng},${wp.location.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error(data.message || 'Routing failed')
  const route = data.routes[0]
  const path: [number, number][] = route.geometry.coordinates.map(
    (c: [number, number]) => [c[1], c[0]]
  )
  return { path, distanceKm: route.distance / 1000, durationSec: route.duration }
}

export default function PickupRoutesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { containers } = useContainers()
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minFillLevel, setMinFillLevel] = useState(50)
  const [maxContainers, setMaxContainers] = useState(8)
  const [firstContainerId, setFirstContainerId] = useState<string | null>(
    (location.state as { preselectedContainerId?: string } | null)?.preselectedContainerId ?? null
  )
  const [selectedContainerIds, setSelectedContainerIds] = useState<Set<string>>(new Set())
  const [generatedRoute, setGeneratedRoute] = useState<{
    containers: Container[]
    totalDistance: number
  } | null>(null)
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [showStartPrompt, setShowStartPrompt] = useState(false)
  const lastFittedKeyRef = useRef<string>('')

  const filteredContainers = useMemo(
    () => containers.filter(c => {
      if (c.fillLevel < minFillLevel) return false
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return (
        c.id.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
      )
    }),
    [containers, searchQuery, minFillLevel]
  )

  useEffect(() => {
    if (!map || !filteredContainers.length) return

    const fitKey = filteredContainers
      .map(c => `${c.id}:${c.location.lat.toFixed(6)},${c.location.lng.toFixed(6)}`)
      .join('|')
    if (fitKey === lastFittedKeyRef.current) return
    lastFittedKeyRef.current = fitKey

    if (filteredContainers.length === 1) {
      const only = filteredContainers[0]
      map.setView([only.location.lat, only.location.lng], 15)
      return
    }

    const bounds = filteredContainers.map(c => [c.location.lat, c.location.lng] as [number, number])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
  }, [map, filteredContainers])

  const additionalCount = selectedContainerIds.size
  const totalCount = (firstContainerId ? 1 : 0) + additionalCount
  const additionalMax = maxContainers - (firstContainerId ? 1 : 0)

  function setFirst(id: string | null) {
    setFirstContainerId(id)
  }

  function toggleContainer(id: string) {
    if (id === firstContainerId) return
    setSelectedContainerIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < additionalMax) next.add(id)
      return next
    })
  }

  function selectAllFiltered() {
    const ids = filteredContainers.filter(c => c.id !== firstContainerId).map(c => c.id).slice(0, additionalMax)
    setSelectedContainerIds(new Set(ids))
    if (!firstContainerId && filteredContainers.length > 0) {
      setFirstContainerId(filteredContainers[0].id)
    }
  }

  function clearSelection() {
    setFirstContainerId(null)
    setSelectedContainerIds(new Set())
  }

  async function generateRoute() {
    if (!firstContainerId && additionalCount > 0) {
      setShowStartPrompt(true)
      setTimeout(() => setShowStartPrompt(false), 3000)
      return
    }

    const first = firstContainerId ? containers.find(c => c.id === firstContainerId) : undefined
    const additional = containers.filter(c => selectedContainerIds.has(c.id))
    if (!first || additional.length < 1) return

    const ordered = nearestNeighborOrder(additional, first)
    const allStops = [first, ...ordered]
    setIsRouteLoading(true)

    try {
      const { path, distanceKm } = await fetchRoute(allStops)
      setRoutePath(path)
      setGeneratedRoute({ containers: allStops, totalDistance: distanceKm })
    } catch {
      const fallbackPath = allStops.map(c => [c.location.lat, c.location.lng] as [number, number])
      setRoutePath(fallbackPath)
      let total = 0
      for (let i = 0; i < allStops.length - 1; i++) {
        total += haversine(allStops[i].location, allStops[i + 1].location)
      }
      setGeneratedRoute({ containers: allStops, totalDistance: total })
    } finally {
      setIsRouteLoading(false)
    }
  }

  function clearRoute() {
    setGeneratedRoute(null)
    setRoutePath(null)
  }

  const routeStops = generatedRoute
    ? generatedRoute.containers.map((c, i) => ({
        num: i + 1,
        status: (i === 0 ? 'next' : 'upcoming') as 'next' | 'upcoming',
        street: c.address || c.name || c.id,
        container: c.id,
        fill: `${c.fillLevel}%`,
        fillColor: c.fillLevel > 90 ? 'red' : c.fillLevel >= 50 ? 'yellow' : 'green' as const,
        name: c.name || c.id,
      }))
    : []

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Routes</h1>
          <p className="text-sm text-gray-500">Route Creator • Select containers and generate an optimized route</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-green-600 font-medium text-sm">
            <FontAwesomeIcon icon={faRoute} />
            <span>{generatedRoute ? `${generatedRoute.containers.length} stops` : 'No route'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Route Creator */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-gray-200 bg-white flex-shrink-0 h-full overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative bg-gray-50 rounded-xl flex items-center p-2 border border-gray-200">
              <div className="pl-2 text-gray-400"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search containers..."
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1 text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Fill Level</label>
                <span className="text-sm font-bold text-gray-900">{minFillLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minFillLevel}
                onChange={e => setMinFillLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Max Containers</label>
                <div className="relative bg-gray-50 rounded-xl border border-gray-200 flex items-center">
                  <button
                    onClick={() => setMaxContainers(Math.max(2, maxContainers - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 border-r border-gray-200"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-bold text-gray-900">{maxContainers}</span>
                  <button
                    onClick={() => setMaxContainers(Math.min(50, maxContainers + 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 border-l border-gray-200"
                  >+</button>
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <button onClick={selectAllFiltered} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
                  Select All
                </button>
                <button onClick={clearSelection} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Container List or Route Summary */}
          <div className="flex-1 overflow-y-auto">
            {generatedRoute ? (
              <div className="p-4 space-y-4">
                <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center justify-center">
                      <FontAwesomeIcon icon={faTruckFast} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold">Optimized Route</h3>
                      <p className="text-xs text-gray-500">{generatedRoute.containers.length} stops</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      ['Stops', generatedRoute.containers.length],
                      ['Distance', formatDistance(generatedRoute.totalDistance)],
                      ['Est. Time', estimateTime(generatedRoute.totalDistance, generatedRoute.containers.length)],
                      ['Avg Fill', `${Math.round(generatedRoute.containers.reduce((s, c) => s + c.fillLevel, 0) / generatedRoute.containers.length)}%`],
                    ].map(([label, val]) => (
                      <div key={label as string} className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-center">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className="text-sm font-bold text-gray-900">{val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => navigate('/routes/active', { state: { containers: generatedRoute.containers, totalDistance: generatedRoute.totalDistance, routePath } })} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <FontAwesomeIcon icon={faPlay} /> Start Route
                    </button>
                    <button onClick={clearRoute} className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <FontAwesomeIcon icon={faTrashCan} /> Clear Route
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Containers ({filteredContainers.length} available)</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{totalCount} selected</span>
                </div>

                <div className="flex items-center gap-2 px-1 mb-3 text-xs text-gray-400">
                  <FontAwesomeIcon icon={faFlag} className="text-green-600" /> <span>= Start point</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <FontAwesomeIcon icon={faCheck} className="text-green-600 text-[10px]" /> <span>= Additional stop</span>
                </div>

                {filteredContainers.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No containers match the current filter
                  </div>
                )}

                {filteredContainers.map(c => {
                  const isFirst = c.id === firstContainerId
                  const isAdditional = selectedContainerIds.has(c.id)
                  const additionalDisabled = !isAdditional && additionalCount >= additionalMax && additionalMax > 0
                  return (
                    <div
                      key={c.id}
                      className={`flex items-stretch rounded-xl border overflow-hidden transition-all mb-2 ${
                        isFirst
                          ? 'border-green-300 bg-green-50'
                          : isAdditional
                            ? 'border-green-200 bg-green-50'
                            : additionalDisabled
                              ? 'border-gray-100 bg-gray-50 opacity-40'
                              : 'border-gray-100 bg-white shadow-sm hover:border-gray-300'
                      }`}
                    >
                      {/* Flag area */}
                      <div
                        onClick={() => {
                          setFirst(isFirst ? null : c.id)
                          setShowStartPrompt(false)
                        }}
                        className={`w-9 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                          isFirst
                            ? 'bg-green-600 text-white'
                            : showStartPrompt
                              ? 'bg-amber-100 text-amber-600 animate-pulse'
                              : 'bg-gray-50 text-gray-300 hover:text-gray-500'
                        }`}
                        title={isFirst ? 'Remove as start point' : 'Set as start point'}
                      >
                        <FontAwesomeIcon icon={faFlag} className="text-xs" />
                      </div>
                      {/* Checkbox */}
                      <div
                        onClick={() => !additionalDisabled && !isFirst && toggleContainer(c.id)}
                        className={`w-10 flex items-center justify-center flex-shrink-0 ${
                          isFirst ? '' : 'cursor-pointer'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          isFirst || isAdditional ? 'bg-green-600 border-green-600' : 'border-gray-300'
                        }`}>
                          {(isFirst || isAdditional) && <FontAwesomeIcon icon={faCheck} className="text-white text-[8px]" />}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 flex items-center gap-3 py-2.5 pr-3 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isFirst && <span className="text-[10px] font-bold text-green-700 uppercase bg-green-100 px-1.5 py-0.5 rounded">Start</span>}
                            <span className="text-sm font-medium text-gray-900 truncate">{c.name || c.id}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              c.fillLevel > 90 ? 'bg-red-50 text-red-600' :
                              c.fillLevel >= 50 ? 'bg-yellow-50 text-yellow-700' :
                              'bg-green-50 text-green-700'
                            }`}>{c.fillLevel}%</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{c.address || c.id}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: markerColor(c.fillLevel) }}>
                          {wasteEmoji(c.wasteType)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Generate Button (sticky bottom) */}
          <div className="p-4 border-t border-gray-200">
            {showStartPrompt && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 text-xs font-medium animate-pulse">
                <FontAwesomeIcon icon={faFlag} className="text-amber-600" />
                Please select a starting point by clicking a flag icon
              </div>
            )}
            <button
              onClick={generateRoute}
              disabled={totalCount < 2 || isRouteLoading}
              className={`w-full font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${
                isRouteLoading
                  ? 'bg-gray-200 text-gray-500 cursor-wait'
                  : totalCount >= 2
                    ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isRouteLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Routing along streets…</>
              ) : (
                <><FontAwesomeIcon icon={faRoute} /> Generate Route ({totalCount} stops)</>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Map + Stop Details */}
        <div className="flex-1 relative flex flex-col">
          <div className="flex-1 relative">
            <MapContainer center={[41.9981, 21.4254]} zoom={13} className="absolute inset-0 z-0" ref={setMap}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredContainers.map(container => {
                const isFirst = container.id === firstContainerId
                const isAdditional = selectedContainerIds.has(container.id)
                return (
                <Marker
                  key={container.id}
                  position={[container.location.lat, container.location.lng]}
                  icon={markerIcon(container, isFirst || isAdditional)}
                  eventHandlers={{
                    click: () => toggleContainer(container.id),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{container.name}</p>
                      <p className="text-gray-600">{container.address}</p>
                      <p className="mt-1">Fill level: {container.fillLevel}%</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isFirst ? '⭐ Start point' : isAdditional ? '✓ Added to route' : 'Click to add stop'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )})}
              {routePath && routePath.length >= 2 && (
                <Polyline
                  positions={routePath}
                  pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8 }}
                />
              )}
            </MapContainer>

            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button onClick={() => map?.zoomIn()} className="w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:text-green-600 transition-colors">
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button onClick={() => map?.zoomOut()} className="w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:text-green-600 transition-colors">
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <button onClick={() => map?.setView([41.9981, 21.4254], 13)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl text-green-600 shadow-sm flex items-center justify-center hover:bg-green-50 transition-colors mt-2">
                <FontAwesomeIcon icon={faLocationCrosshairs} />
              </button>
            </div>
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm z-10">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Fill Level</h4>
              <div className="flex flex-col gap-2">
                {[['bg-red-500', 'Full (>80%)'], ['bg-yellow-500', 'Moderate (40-80%)'], ['bg-green-500', 'Empty (<40%)']].map(([cls, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cls}`} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stop Details Drawer */}
          <div className="h-64 bg-white border-t border-gray-200 flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {generatedRoute ? 'Optimized Route - Stop Details' : 'Route Stops'}
                </h2>
                {generatedRoute && (
                  <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded-md">
                    {generatedRoute.containers.length} Stops
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileExport} /> Export Manifest
                </button>
                <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                  <FontAwesomeIcon icon={faLocationArrow} /> Send to Driver
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto p-4 flex gap-4">
              {routeStops.length === 0 ? (
                <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                  Select at least 2 containers and click "Generate Route"
                </div>
              ) : (
                routeStops.map(stop => (
                  <div key={stop.num} className={`min-w-[280px] rounded-xl p-4 border relative overflow-hidden ${
                    stop.status === 'next'
                      ? 'bg-white border-green-300 shadow-[0_0_12px_rgba(22,163,74,0.15)]'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    {stop.status === 'next' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold ${
                          stop.status === 'next'
                            ? 'bg-green-600 text-white border-transparent'
                            : 'bg-gray-100 border-gray-200 text-gray-600'
                        }`}>
                          {stop.num}
                        </div>
                        <span className={`font-semibold text-sm ${stop.status === 'next' ? 'text-gray-900' : 'text-gray-700'}`}>
                          {stop.status === 'next' ? 'Next Stop' : `Stop ${stop.num}`}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mb-1 font-medium truncate ${stop.status === 'next' ? 'text-gray-900' : 'text-gray-700'}`}>
                      {stop.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2 truncate">{stop.street}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{stop.container}</span>
                      <span className={`font-medium ${
                        stop.fillColor === 'red' ? 'text-red-600' :
                        stop.fillColor === 'yellow' ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {stop.fill}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
