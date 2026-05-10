import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsTurnRight, faPlus, faMinus, faLocationArrow, faLocationDot,
  faClipboardList, faCarSide, faDumpsterFire, faTriangleExclamation,
  faCheckDouble, faCircleDot,
} from '@fortawesome/free-solid-svg-icons'
import MapPlaceholder from '../components/ui/MapPlaceholder'

const quickIssues = [
  { icon: faCarSide, label: 'Blocked\nAccess', color: 'amber' },
  { icon: faDumpsterFire, label: 'Overflow\nSpill', color: 'red' },
  { icon: faTriangleExclamation, label: 'Damaged\nBin', color: 'blue' },
]

export default function ActivePickupPage() {
  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Pickup</h1>
          <p className="text-sm text-gray-500">Centar District Alpha • Route in Progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200 text-green-700 font-medium text-sm">
            <FontAwesomeIcon icon={faCircleDot} className="text-xs animate-pulse" />
            <span>Live Tracking</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <MapPlaceholder className="absolute inset-0" />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {[faPlus, faMinus].map((icon, i) => (
              <button key={i} className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                <FontAwesomeIcon icon={icon} className="text-lg" />
              </button>
            ))}
            <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-green-600 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors mt-2">
              <FontAwesomeIcon icon={faLocationArrow} className="text-lg" />
            </button>
          </div>

          {/* Turn Instruction */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-6 z-10 w-[90%] lg:w-auto max-w-md">
            <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-2xl flex items-center gap-5 border border-gray-700">
              <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-600 flex-shrink-0">
                <FontAwesomeIcon icon={faArrowsTurnRight} className="text-3xl text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">150</span>
                  <span className="text-lg font-medium text-gray-400">m</span>
                </div>
                <div className="text-base font-medium text-gray-200 mt-1">
                  Turn right onto <span className="text-white font-bold">Blvd. Partizanski Odredi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Progress Bottom */}
          <div className="absolute bottom-6 left-6 z-10 hidden lg:block">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 flex items-center gap-6">
              {[['ETA', '10:15 AM', ''], ['Distance', '1.2 km', ''], ['Time', '4 min', 'text-green-600']].map(([label, val, cls]) => (
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
        <div className="w-full lg:w-[480px] bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
          {/* Progress */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Route Progress</div>
              <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">Stop 3 of 18</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: '16%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>2 Completed</span>
              <span>16 Remaining</span>
            </div>
          </div>

          {/* Next Stop Details */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Next Stop Details</h2>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Container ID</div>
                    <div className="text-2xl font-bold text-gray-900">C-1042</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fill Level</div>
                    <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-bold border border-red-100">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" /> 95%
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
                      <div className="font-semibold text-gray-900 text-base">Blvd. Partizanski Odredi 14</div>
                      <div className="text-sm text-gray-600">Centar, Skopje 1000</div>
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
                    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:${
                      item.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      item.color === 'red' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    } transition-colors`}>
                      <FontAwesomeIcon icon={item.icon} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 whitespace-pre-line text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-30">
            <div className="flex flex-col gap-3">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 text-lg group">
                <FontAwesomeIcon icon={faLocationDot} className="group-hover:scale-110 transition-transform" /> Arrived at Stop
              </button>
              <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-lg opacity-50 cursor-not-allowed">
                <FontAwesomeIcon icon={faCheckDouble} /> Complete Pickup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
