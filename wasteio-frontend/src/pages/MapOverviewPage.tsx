import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faMicrophone, faFilter, faRecycle, faTrashCan,
  faPlus, faMinus, faLocationCrosshairs, faLayerGroup,
  faXmark, faTemperatureHalf, faBatteryThreeQuarters, faRoute,
} from '@fortawesome/free-solid-svg-icons'
import MapPlaceholder from '../components/ui/MapPlaceholder'

export default function MapOverviewPage() {
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(true)

  return (
    <div className="flex-1 relative h-full flex flex-col overflow-hidden">
      {/* Map Background */}
      <MapPlaceholder className="absolute inset-0 z-0" />

      {/* Top Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 lg:p-6 pointer-events-none flex justify-between items-start gap-4">
        {/* Search & Filters */}
        <div className="flex-1 max-w-2xl flex flex-col gap-3 pointer-events-auto">
          <div className="relative bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex items-center p-2 border border-gray-100">
            <div className="pl-3 text-gray-400">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <input type="text" placeholder="Search container ID, address, or street..." className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-2 text-sm text-gray-800 placeholder-gray-400" />
            <button className="w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center">
              <FontAwesomeIcon icon={faMicrophone} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:border-green-300 hover:bg-green-50 transition-all flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400" /> All Filters
            </button>
            <div className="h-6 w-px bg-gray-300 self-center mx-1" />
            <button className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl shadow-sm text-sm font-medium text-red-700 hover:bg-red-100 transition-all flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Critical (12)
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2">
              <FontAwesomeIcon icon={faRecycle} className="text-blue-500" /> Plastic
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2">
              <FontAwesomeIcon icon={faTrashCan} className="text-gray-500" /> General
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col gap-3 pointer-events-auto items-end">
          <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden">
            <button className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors border-b border-gray-100">
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors border-b border-gray-100">
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
              <FontAwesomeIcon icon={faLocationCrosshairs} />
            </button>
          </div>
          <button className="w-12 h-12 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors">
            <FontAwesomeIcon icon={faLayerGroup} />
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 lg:left-8 z-20 pointer-events-auto">
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
      {showPreview && (
        <div className="absolute bottom-6 right-6 lg:right-8 z-30 pointer-events-auto w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="h-32 bg-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Location photo</div>
              <button onClick={() => setShowPreview(false)} className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
              <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
                <span className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  ⚠ Requires Pickup Soon
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">Container C-1042</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">Recycling</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationCrosshairs} className="text-gray-400" /> Blvd. Partizanski Odredi 14
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-700">Fill Level</span>
                  <span className="text-lg font-bold text-yellow-600">75%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: '75%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Last updated: 10 mins ago</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-gray-400 mb-1 text-sm"><FontAwesomeIcon icon={faTemperatureHalf} /></div>
                  <span className="block text-sm font-semibold text-gray-900">24°C</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Internal Temp</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-gray-400 mb-1 text-sm"><FontAwesomeIcon icon={faBatteryThreeQuarters} /></div>
                  <span className="block text-sm font-semibold text-gray-900">82%</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Sensor Battery</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate('/containers/C-1042')} className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Full Details
                </button>
                <button className="flex-[2] bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-500/20 text-sm flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faRoute} /> Add to Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
