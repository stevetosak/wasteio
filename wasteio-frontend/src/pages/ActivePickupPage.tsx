import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsTurnRight, faPlus, faMinus, faLocationArrow, faLocationDot,
  faClipboardList, faCarSide, faDumpsterFire, faTriangleExclamation,
  faCircleDot, faFlagCheckered, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { MapContainer, Marker, Popup, TileLayer, Polyline } from 'react-leaflet'
import { divIcon, type Map as LeafletMap } from 'leaflet'
import { getStoredToken } from '../lib/authApi'
import { Spinner } from '../components/ui/Spinner'
import type { Container } from '../types/container'
import { envConfig } from '../config/env'

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

function activeMarkerIcon(container: Container, status: 'completed' | 'current' | 'upcoming') {
  const color = markerColor(container.fillLevel)
  const size = status === 'current' ? 34 : status === 'completed' ? 24 : 28
  const border = status === 'current' ? '3px solid #16a34a' : '2px solid #ffffff'
  const shadow = status === 'current'
    ? '0 8px 18px rgba(22,163,74,0.35)'
    : '0 4px 10px rgba(0,0,0,0.2)'
  const opacity = status === 'completed' ? 0.5 : 1

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
      font-size:${status === 'current' ? 14 : 11}px;
      color:white;
      opacity:${opacity};
      transition:all 150ms ease;
    ">${status === 'completed' ? '✓' : wasteEmoji(container.wasteType)}</div>`,
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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function estimateMinutes(km: number, stops: number): number {
  return Math.round((km / 30) * 60 + stops * 3)
}

const quickIssues = [
  { icon: faCarSide, label: 'Blocked\nAccess', color: 'amber' },
  { icon: faDumpsterFire, label: 'Overflow\nSpill', color: 'red' },
  { icon: faTriangleExclamation, label: 'Damaged\nBin', color: 'blue' },
]

export default function ActivePickupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeData = location.state as {
    containers: Container[]
    totalDistance: number
    routePath?: [number, number][]
  } | null

  const stops = routeData?.containers ?? []

  useEffect(() => {
    if (!routeData || stops.length === 0) {
      navigate('/routes', { replace: true })
    }
  }, [])

  const [map, setMap] = useState<LeafletMap | null>(null)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [completedStops, setCompletedStops] = useState<number[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectError, setCollectError] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'details'>('map')

  if (!routeData || stops.length === 0) return null

  const routePath = routeData.routePath
  const currentStop = stops[currentStopIndex]
  const isLastStop = currentStopIndex >= stops.length - 1
  const isFinished = completedStops.length === stops.length
  const completedCount = completedStops.length
  const progress = stops.length > 0 ? (completedCount / stops.length) * 100 : 0

  let remainingDistance = 0
  for (let i = currentStopIndex; i < stops.length - 1; i++) {
    remainingDistance += haversine(stops[i].location, stops[i + 1].location)
  }
  const remainingMinutes = estimateMinutes(remainingDistance, stops.length - currentStopIndex)
  const eta = new Date(Date.now() + remainingMinutes * 60000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    if (!map || !currentStop) return
    map.setView([currentStop.location.lat, currentStop.location.lng], 15)
  }, [map, currentStopIndex])

  async function handleCollect() {
    if (!currentStop) return
    setIsCollecting(true)
    setCollectError(null)

    try {
      const token = getStoredToken()
      const res = await fetch(`${envConfig.API_URL}/devices/${currentStop.id}/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
    } catch (e) {
      setCollectError(e instanceof Error ? e.message : 'Failed to complete pickup')
      setIsCollecting(false)
      return
    }

    setIsCollecting(false)
    setCompletedStops(prev => [...prev, currentStopIndex])
    if (!isLastStop) {
      setCurrentStopIndex(prev => prev + 1)
    }
  }

  function handleFinish() {
    navigate('/routes')
  }

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 sm:h-20 flex justify-between items-center px-4 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Active Pickup</h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            Optimized Route • {completedCount} of {stops.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex lg:hidden bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMobileView('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobileView === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Map
            </button>
            <button
              onClick={() => setMobileView('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobileView === 'details' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Details
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200 text-green-700 font-medium text-sm">
            <FontAwesomeIcon icon={faCircleDot} className="text-xs animate-pulse" />
            <span>Live Tracking</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className={`${mobileView === 'map' ? 'flex-1' : 'hidden'} lg:flex-1 relative`}>
          <MapContainer center={[41.9981, 21.4254]} zoom={13} className="absolute inset-0 z-0" ref={setMap}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {stops.map((container, i) => {
              const status = completedStops.includes(i) ? 'completed' as const
                : i === currentStopIndex ? 'current' as const
                : 'upcoming' as const
              return (
                <Marker
                  key={container.id}
                  position={[container.location.lat, container.location.lng]}
                  icon={activeMarkerIcon(container, status)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{container.name}</p>
                      <p className="text-gray-600">{container.address}</p>
                      <p className="mt-1">Fill level: {container.fillLevel}%</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {status === 'completed' ? '✓ Collected' : status === 'current' ? '← Current Stop' : `Stop #${i + 1}`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
            {routePath && routePath.length >= 2 && (
              <Polyline
                positions={routePath}
                pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.7 }}
              />
            )}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button onClick={() => map?.zoomIn()} className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="text-lg" />
            </button>
            <button onClick={() => map?.zoomOut()} className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <FontAwesomeIcon icon={faMinus} className="text-lg" />
            </button>
            <button onClick={() => {
              const bounds = stops.map(s => [s.location.lat, s.location.lng] as [number, number])
              map?.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
            }} className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-green-600 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors mt-2">
              <FontAwesomeIcon icon={faLocationArrow} className="text-lg" />
            </button>
          </div>

          {/* Turn Instruction */}
          {!isFinished && currentStop && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-6 z-10 w-[90%] lg:w-auto max-w-md">
              <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-2xl flex items-center gap-5 border border-gray-700">
                <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-600 flex-shrink-0">
                  <FontAwesomeIcon icon={faArrowsTurnRight} className="text-3xl text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{formatDistance(remainingDistance).split(' ')[0]}</span>
                    <span className="text-lg font-medium text-gray-400">{formatDistance(remainingDistance).split(' ')[1] || ''}</span>
                  </div>
                  <div className="text-base font-medium text-gray-200 mt-1">
                    Proceed to <span className="text-white font-bold">{currentStop.name || currentStop.id}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {currentStop.address || ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile floating Complete button — shown on map view only */}
          <div className="lg:hidden absolute bottom-4 inset-x-4 z-20">
            {isFinished ? (
              <button onClick={handleFinish} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
                <FontAwesomeIcon icon={faFlagCheckered} /> Finish Route
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleCollect}
                  disabled={isCollecting}
                  className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isCollecting ? 'bg-gray-200 text-gray-500 cursor-wait'
                    : collectError ? 'bg-red-500 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isCollecting ? <><Spinner size="sm" /> Collecting…</> : <><FontAwesomeIcon icon={faCheck} /> {isLastStop ? 'Complete Final Stop' : 'Complete Pickup'}</>}
                </button>
                {collectError && <p className="text-xs text-red-500 text-center bg-white/80 rounded-lg px-2 py-1">{collectError}</p>}
              </div>
            )}
          </div>

          {/* Route Progress Bottom */}
          <div className="absolute bottom-6 left-6 z-10 hidden lg:block">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex items-center gap-6">
              {[
                ['ETA', eta, ''],
                ['Distance', formatDistance(remainingDistance), ''],
                ['Time', `${remainingMinutes} min`, remainingMinutes < 10 ? 'text-green-600 font-bold' : ''],
              ].map(([label, val, cls]) => (
                <div key={label} className="flex items-center gap-6">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                    <div className={`text-xl font-bold ${cls || 'text-gray-900'}`}>{val}</div>
                  </div>
                  {label !== 'Time' && <div className="w-px h-10 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Turn-by-Turn */}
        <div className={`${mobileView === 'details' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[480px] bg-white border-l border-gray-200 flex-col h-full flex-shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]`}>
          {/* Progress */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Route Progress</div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full ${isFinished ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
                {isFinished ? 'Complete!' : `Stop ${currentStopIndex + 1} of ${stops.length}`}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>{completedCount} Completed</span>
              <span>{stops.length - completedCount} Remaining</span>
            </div>
          </div>

          {/* Next Stop Details or Finished State */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {isFinished ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                  <FontAwesomeIcon icon={faFlagCheckered} className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Route Complete!</h2>
                <p className="text-gray-500 mb-1">All {stops.length} stops have been collected.</p>
                <p className="text-sm text-gray-400">Great work today.</p>
              </div>
            ) : currentStop ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Current Stop Details
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Container</div>
                        <div className="text-2xl font-bold text-gray-900">{currentStop.name || currentStop.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fill Level</div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${
                          currentStop.fillLevel > 90
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : currentStop.fillLevel >= 50
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          {currentStop.fillLevel > 90 && <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" />}
                          {currentStop.fillLevel}%
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0 mt-1">
                          <FontAwesomeIcon icon={faLocationDot} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Address</div>
                          <div className="font-semibold text-gray-900 text-base">{currentStop.address || '—'}</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0 mt-1">
                          <FontAwesomeIcon icon={faClipboardList} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Driver Notes</div>
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 font-medium">
                            Gate code is 4421. Container is located behind the main building near the loading dock.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Issue Reporting */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Quick Report Issue</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {quickIssues.map(item => (
                      <button key={item.label} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center group">
                        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 transition-colors group-hover:${
                          item.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                          item.color === 'red' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <FontAwesomeIcon icon={item.icon} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 whitespace-pre-line text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-30">
            {isFinished ? (
              <button onClick={handleFinish} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg text-lg">
                <FontAwesomeIcon icon={faFlagCheckered} /> Finish Route
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCollect}
                  disabled={isCollecting}
                  className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg ${
                    isCollecting
                      ? 'bg-gray-200 text-gray-500 cursor-wait'
                      : collectError
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isCollecting ? (
                    <><Spinner size="sm" /> Collecting…</>

                  ) : (
                    <><FontAwesomeIcon icon={faCheck} /> {isLastStop ? 'Complete Final Stop' : 'Complete Pickup'}</>
                  )}
                </button>
                {collectError && (
                  <p className="text-xs text-red-500 text-center">{collectError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
