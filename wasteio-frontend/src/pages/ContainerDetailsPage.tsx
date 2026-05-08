import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faMagnifyingGlass, faArrowUpRightFromSquare, faPlus,
  faLocationDot, faExpand, faLocationArrow, faArrowTrendUp,
  faBatteryThreeQuarters, faRoute, faFlag, faTriangleExclamation, faCamera,
  faCircleDot,
} from '@fortawesome/free-solid-svg-icons'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import MapPlaceholder from '../components/ui/MapPlaceholder'

const fillHistory = [
  { day: 'Mon', fill: 20 },
  { day: 'Tue', fill: 45 },
  { day: 'Wed', fill: 80 },
  { day: 'Thu', fill: 15 },
  { day: 'Fri', fill: 40 },
  { day: 'Sat', fill: 65 },
  { day: 'Sun', fill: 75 },
]

export default function ContainerDetailsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 lg:mx-6 lg:mt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/containers')} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Container C-1042</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" /> Blvd. Partizanski Odredi 14, Centar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative bg-gray-50 rounded-xl flex items-center p-2 border border-gray-200 w-64 hidden md:flex">
            <div className="pl-2 text-gray-400"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
            <input type="text" placeholder="Search container..." className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1 text-sm text-gray-900 placeholder-gray-400" />
          </div>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Export
          </button>
          <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl shadow-md text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Add to Route
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
                  <div className="text-5xl font-bold text-white mb-2">75% <span className="text-xl text-gray-400 font-medium">Full</span></div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <FontAwesomeIcon icon={faArrowTrendUp} /> +12% since yesterday
                  </div>
                </div>
                <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleDot} className="text-blue-400" /> Recycling
                </span>
              </div>
              <div className="relative z-10 mt-8">
                <div className="flex justify-between text-sm mb-2 text-gray-400">
                  <span>Empty</span><span>Full</span>
                </div>
                <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full w-[75%] relative">
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4 flex items-center gap-2">
                  Predicted full in: <strong className="text-white">4 hours</strong>
                </p>
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
                <p className="text-sm text-gray-500">Past 7 days volume trends</p>
              </div>
              <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block p-2">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fillHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Container Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Container Details</h2>
            <div className="space-y-4">
              {[
                ['Container ID', '#C-1042'],
                ['Waste Type', <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Recycling</span>],
                ['Capacity', '1100 Liters'],
                ['Last Pickup', 'Yesterday, 14:30'],
                ['Sensor Battery', <span className="flex items-center gap-2"><FontAwesomeIcon icon={faBatteryThreeQuarters} className="text-green-500" /> 82%</span>],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issues & Photos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Reported Issues</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">1 Active</span>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">Partially Blocked Access</h4>
                  <p className="text-xs text-red-600 mt-1">Reported by Driver #42 • 2 hrs ago</p>
                  <p className="text-sm text-gray-700 mt-2">A parked vehicle is partially blocking access to the container. Might need a smaller truck or manual move.</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Photos</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative group cursor-pointer flex items-center justify-center text-gray-400 text-xs">
                Container photo
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white" />
                </div>
              </div>
              <div className="h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer bg-gray-50">
                <FontAwesomeIcon icon={faCamera} className="mb-1" />
                <span className="text-xs font-medium">Add Photo</span>
              </div>
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
