import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRecycle, faMagnifyingGlass, faSliders, faLocationDot,
  faBuilding, faTreeCity, faPlaneUp, faShop, faArrowRight,
  faCircleInfo, faTruck,
} from '@fortawesome/free-solid-svg-icons'
import MapPlaceholder from '../components/ui/MapPlaceholder'

const zones = [
  { id: 'centar', label: 'Centar', subtitle: 'Zone 1 • 145 Containers', icon: faBuilding, total: 145, critical: 32, routes: 8 },
  { id: 'karpos', label: 'Karpoš', subtitle: 'Zone 2 • 182 Containers', icon: faTreeCity, total: 182, critical: 18, routes: 10 },
  { id: 'aerodrom', label: 'Aerodrom', subtitle: 'Zone 3 • 210 Containers', icon: faPlaneUp, total: 210, critical: 41, routes: 12 },
  { id: 'cair', label: 'Čair', subtitle: 'Zone 4 • 95 Containers', icon: faShop, total: 95, critical: 11, routes: 5 },
]

const recent = ['Centar', 'Karpoš']

export default function SelectJurisdictionPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('centar')
  const [search, setSearch] = useState('')

  const filtered = zones.filter(z => z.label.toLowerCase().includes(search.toLowerCase()))
  const selectedZone = zones.find(z => z.id === selected)

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-[1440px] min-h-[900px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Selection Panel */}
        <section className="w-full lg:w-[500px] xl:w-[600px] p-8 sm:p-10 lg:p-12 flex flex-col h-full relative z-10 bg-white border-r border-gray-100 flex-shrink-0">
          <header className="mb-10 flex-shrink-0">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
                <FontAwesomeIcon icon={faRecycle} className="text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Wasteio</span>
            </button>
          </header>

          <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-40">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Select Jurisdiction</h1>
              <p className="text-gray-500 text-base">Choose the municipality or zone you will be operating in today.</p>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </div>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search municipality or zone..."
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-white focus:bg-white shadow-sm text-sm font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                    <FontAwesomeIcon icon={faSliders} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recent</h3>
                <button className="text-xs font-medium text-green-600 hover:text-green-700">Clear</button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recent.map(r => (
                  <button key={r} className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors shadow-sm group">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                      <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* All Zones */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">All Zones</h3>
              <div className="space-y-3">
                {filtered.map(zone => (
                  <label key={zone.id} className={`relative flex cursor-pointer rounded-2xl p-4 transition-all ${
                    selected === zone.id
                      ? 'border-2 border-green-500 bg-green-50 shadow-sm'
                      : 'border border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50 shadow-sm'
                  }`}>
                    <input type="radio" name="jurisdiction" value={zone.id} checked={selected === zone.id} onChange={() => setSelected(zone.id)} className="sr-only" />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center border ${
                          selected === zone.id ? 'bg-white border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}>
                          <FontAwesomeIcon icon={zone.icon} className="text-lg" />
                        </div>
                        <div>
                          <p className={`font-semibold ${selected === zone.id ? 'text-gray-900' : 'text-gray-900'}`}>{zone.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{zone.subtitle}</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selected === zone.id ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
                      }`}>
                        {selected === zone.id && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 lg:p-12 bg-gradient-to-t from-white via-white to-transparent pt-12">
            <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold block mb-0.5">Driver Role Active</span>
                You will only see optimized routes and container statuses for the selected jurisdiction.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => navigate('/signin')} className="px-6 py-3.5 border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={() => navigate('/map')} className="flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                Continue to Dashboard
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </section>

        {/* Right: Map */}
        <section className="hidden lg:flex flex-1 relative overflow-hidden bg-gray-100">
          <MapPlaceholder className="absolute inset-0 opacity-80" />
          <div className="absolute inset-0 z-10 p-8 flex flex-col pointer-events-none">
            <div className="flex justify-between items-start w-full">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pointer-events-auto">
                <FontAwesomeIcon icon={faLocationDot} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-800">Skopje, MK</span>
              </div>
            </div>

            <div className="flex-1 relative w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white z-10">
                <FontAwesomeIcon icon={faTruck} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border-2 border-green-500/50 bg-green-500/10" />
              </div>
              <div className="absolute top-[20%] left-[30%] bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-100 flex items-center gap-2 pointer-events-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-gray-800">Full</span>
              </div>
              <div className="absolute top-[60%] left-[65%] bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-100 flex items-center gap-2 pointer-events-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-xs font-bold text-gray-800">Mod</span>
              </div>
              <div className="absolute top-[40%] left-[55%] bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-100 flex items-center gap-2 pointer-events-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-gray-800">Empty</span>
              </div>
            </div>

            {selectedZone && (
              <div className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-5 pointer-events-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{selectedZone.label} Overview</h4>
                    <p className="text-xs text-gray-500 mt-1">Live Status • Updated just now</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">Active</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <span className="block text-xl font-bold text-gray-900">{selectedZone.total}</span>
                    <span className="block text-[10px] font-medium text-gray-500 uppercase mt-1">Total</span>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <span className="block text-xl font-bold text-red-600">{selectedZone.critical}</span>
                    <span className="block text-[10px] font-medium text-red-500 uppercase mt-1">Critical</span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <span className="block text-xl font-bold text-green-600">{selectedZone.routes}</span>
                    <span className="block text-[10px] font-medium text-green-500 uppercase mt-1">Routes</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
