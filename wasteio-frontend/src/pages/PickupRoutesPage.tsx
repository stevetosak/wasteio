import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faSliders, faTruckFast, faTruck, faFire,
  faPlay, faPlus, faMinus, faLocationCrosshairs, faFileExport,
  faLocationArrow, faCheck, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import MapPlaceholder from '../components/ui/MapPlaceholder'

const filters = ['All Routes', 'High Priority', 'Morning Shift', 'Trucks Only']

const routes = [
  {
    id: 1, name: 'Centar District Alpha', vehicle: 'TRK-04 (Large)',
    stops: 24, distance: '12.4 km', eta: '2h 15m',
    priority: 'High Urgency', priorityColor: 'red',
    full: 18, moderate: 6, empty: 0, selected: true,
  },
  {
    id: 2, name: 'Karposh Sector B', vehicle: 'VAN-02 (Medium)',
    stops: 15, distance: '8.2 km', eta: '1h 30m',
    priority: 'Normal', priorityColor: 'yellow',
    full: 6, moderate: 7, empty: 2, selected: false,
  },
  {
    id: 3, name: 'Aerodrom Morning', vehicle: 'TRK-01 (Large)',
    stops: 32, distance: '18.5 km', eta: '3h 10m',
    priority: 'Low', priorityColor: 'green',
    full: 5, moderate: 12, empty: 15, selected: false,
  },
]

const stops = [
  { num: 1, status: 'done', street: 'Blvd. Partizanski Odredi 14', container: 'C-1042', fill: '85%', fillColor: 'green', time: '08:15 AM' },
  { num: 2, status: 'next', street: 'Ul. Makedonija 22', container: 'C-1088', fill: '95%', fillColor: 'red', time: 'ETA: 5 min' },
  { num: 3, status: 'upcoming', street: 'Kej 13ti Noemvri', container: 'C-2011', fill: '60%', fillColor: 'yellow', time: '~08:35 AM' },
  { num: 4, status: 'upcoming', street: 'Ploshtad Makedonija', container: 'C-2015', fill: '82%', fillColor: 'red', time: '~08:45 AM' },
]

export default function PickupRoutesPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All Routes')
  const [selectedRoute, setSelectedRoute] = useState(1)

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111217] overflow-hidden text-gray-100">
      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 bg-[#1a1d24] border-b border-[#2a2e39] flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pickup Routes</h1>
          <p className="text-sm text-gray-400">Skopje Central District • Suggested optimizations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#111217] px-3 py-2 rounded-xl border border-[#2a2e39] text-green-400 font-medium text-sm">
            <FontAwesomeIcon icon={faBolt} />
            <span>System Optimal</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Routes */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-[#2a2e39] bg-[#1a1d24] flex-shrink-0 h-full overflow-hidden">
          <div className="p-4 border-b border-[#2a2e39] bg-[#111217]/50">
            <div className="relative bg-[#111217] rounded-xl flex items-center p-2 border border-[#2a2e39] mb-3">
              <div className="pl-2 text-gray-500"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
              <input type="text" placeholder="Search routes, drivers, or zones..." className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1 text-sm text-white placeholder-gray-500" />
              <button className="w-8 h-8 rounded-lg bg-[#1a1d24] text-gray-400 flex items-center justify-center hover:text-white border border-[#2a2e39]">
                <FontAwesomeIcon icon={faSliders} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(109,40,217,0.3)]' : 'bg-[#111217] border border-[#2a2e39] text-gray-400 hover:text-white'
                }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Suggested Routes</span>
              <span className="bg-[#111217] px-2 py-0.5 rounded text-gray-400">3 Available</span>
            </div>

            {routes.map(route => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                className={`rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all ${
                  selectedRoute === route.id
                    ? 'bg-[#111217] border border-purple-700 shadow-[0_0_15px_rgba(109,40,217,0.3)]'
                    : 'bg-[#111217] border border-[#2a2e39] hover:border-gray-600'
                }`}
              >
                {selectedRoute === route.id && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-700/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                )}
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      selectedRoute === route.id ? 'bg-purple-700/20 text-purple-400 border-purple-700/30' : 'bg-[#1a1d24] text-gray-400 border-[#2a2e39]'
                    }`}>
                      <FontAwesomeIcon icon={route.id === 1 ? faTruckFast : faTruck} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{route.name}</h3>
                      <p className="text-xs text-gray-400">Vehicle: {route.vehicle}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                    route.priorityColor === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    route.priorityColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {route.priorityColor === 'red' && <FontAwesomeIcon icon={faFire} className="text-[10px]" />}
                    {route.priority}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                  {[['Stops', route.stops], ['Distance', route.distance], ['Est. Time', route.eta]].map(([label, val]) => (
                    <div key={label as string} className="bg-[#1a1d24] rounded-lg p-2 border border-[#2a2e39] text-center">
                      <div className="text-xs text-gray-500 mb-1">{label}</div>
                      <div className="text-sm font-bold text-white">{val}</div>
                    </div>
                  ))}
                </div>

                {selectedRoute === route.id && (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-3 relative z-10">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {route.full} Full</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> {route.moderate} Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {route.empty} Empty</span>
                    </div>
                    <button onClick={() => navigate('/routes/active')} className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 relative z-10 shadow-lg">
                      <FontAwesomeIcon icon={faPlay} /> Start Route
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Map + Stop Details */}
        <div className="flex-1 relative flex flex-col">
          <div className="flex-1 relative">
            <MapPlaceholder className="absolute inset-0" />
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              {[faPlus, faMinus].map((icon, i) => (
                <button key={i} className="w-10 h-10 bg-[#1a1d24] border border-[#2a2e39] rounded-xl text-white shadow-lg flex items-center justify-center hover:bg-[#111217] transition-colors">
                  <FontAwesomeIcon icon={icon} />
                </button>
              ))}
              <button className="w-10 h-10 bg-[#1a1d24] border border-[#2a2e39] rounded-xl text-purple-400 shadow-lg flex items-center justify-center hover:bg-[#111217] transition-colors mt-2">
                <FontAwesomeIcon icon={faLocationCrosshairs} />
              </button>
            </div>
            <div className="absolute top-4 left-4 bg-[#1a1d24]/90 backdrop-blur-md border border-[#2a2e39] rounded-xl p-3 shadow-lg z-10">
              <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Fill Level</h4>
              <div className="flex flex-col gap-2">
                {[['bg-red-500', 'Full (>80%)'], ['bg-yellow-500', 'Moderate (40-80%)'], ['bg-green-500', 'Empty (<40%)']].map(([cls, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cls}`} />
                    <span className="text-xs text-gray-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stop Details Drawer */}
          <div className="h-64 bg-[#1a1d24] border-t border-[#2a2e39] flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center bg-[#111217]/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">Centar District Alpha - Stop Details</h2>
                <span className="bg-[#111217] border border-[#2a2e39] text-gray-400 text-xs px-2 py-1 rounded-md">24 Stops Total</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#111217] border border-[#2a2e39] rounded-xl text-sm font-medium text-white hover:bg-[#1a1d24] transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileExport} /> Export Manifest
                </button>
                <button className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faLocationArrow} /> Send to Driver
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto p-4 flex gap-4">
              {stops.map(stop => (
                <div key={stop.num} className={`min-w-[280px] rounded-xl p-4 border relative overflow-hidden ${
                  stop.status === 'done' ? 'bg-[#111217] border-[#2a2e39] opacity-60' :
                  stop.status === 'next' ? 'bg-[#111217] border-purple-700 shadow-[0_0_15px_rgba(109,40,217,0.3)]' :
                  'bg-[#111217] border-[#2a2e39]'
                }`}>
                  {stop.status === 'next' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-700" />}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold ${
                        stop.status === 'done' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        stop.status === 'next' ? 'bg-purple-700 text-white border-transparent' :
                        'bg-[#1a1d24] border-gray-600 text-gray-400'
                      }`}>
                        {stop.status === 'done' ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : stop.num}
                      </div>
                      <span className={`font-semibold text-sm ${stop.status === 'done' ? 'text-white' : stop.status === 'next' ? 'text-white' : 'text-gray-300'}`}>
                        {stop.status === 'next' ? 'Next Stop' : `Stop ${stop.num}`}
                      </span>
                    </div>
                    <span className={`text-xs ${stop.status === 'next' ? 'text-purple-400 font-medium' : 'text-gray-500'}`}>{stop.time}</span>
                  </div>
                  <p className={`text-sm mb-2 truncate ${stop.status === 'next' ? 'text-white' : 'text-gray-400'}`}>{stop.street}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{stop.container}</span>
                    <span className={`font-medium ${stop.fillColor === 'red' ? 'text-red-400' : stop.fillColor === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {stop.status === 'done' ? `Collected (${stop.fill})` : `${stop.fill}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
