import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload, faChevronDown, faTruck, faLeaf, faStopwatch,
  faTriangleExclamation, faEllipsisVertical, faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'

const volumeData = [
  { day: 'Mon', count: 120 }, { day: 'Tue', count: 150 }, { day: 'Wed', count: 140 },
  { day: 'Thu', count: 180 }, { day: 'Fri', count: 210 }, { day: 'Sat', count: 250 }, { day: 'Sun', count: 190 },
]

const fillData = [
  { week: 'Week 1', avg: 75 }, { week: 'Week 2', avg: 82 }, { week: 'Week 3', avg: 78 }, { week: 'Week 4', avg: 85 },
]

const neighborhoods = [
  { name: 'Centar', pickups: 450, fill: 85, fillColor: 'bg-green-500', score: 92, overflows: 5, status: 'Optimal', statusStyle: 'bg-green-100 text-green-700' },
  { name: 'Karposh', pickups: 320, fill: 78, fillColor: 'bg-green-500', score: 88, overflows: 2, status: 'Optimal', statusStyle: 'bg-green-100 text-green-700' },
  { name: 'Aerodrom', pickups: 280, fill: 92, fillColor: 'bg-amber-500', score: 75, overflows: 4, status: 'Needs Review', statusStyle: 'bg-amber-100 text-amber-700' },
  { name: 'Chair', pickups: 198, fill: 98, fillColor: 'bg-red-500', score: 62, overflows: 8, status: 'Critical', statusStyle: 'bg-red-100 text-red-700' },
]

const statsCards = [
  { label: 'Pickups Completed', value: '1,248', icon: faTruck, iconBg: 'bg-green-50 text-green-600', trend: '+12% vs last week', trendColor: 'text-green-600' },
  { label: 'Route Efficiency', value: '342 km', icon: faLeaf, iconBg: 'bg-green-50 text-green-600', trend: 'Saved this week', trendColor: 'text-green-600' },
  { label: 'Avg Response Time', value: '45 min', icon: faStopwatch, iconBg: 'bg-blue-50 text-blue-600', trend: '-5 min improvement', trendColor: 'text-blue-600' },
  { label: 'Overflow Incidents', value: '12', icon: faTriangleExclamation, iconBg: 'bg-red-50 text-red-600', trend: '-3 vs last week', trendColor: 'text-red-600' },
]

const dateRanges = ['Today', 'This Week', 'This Month', 'Custom']

export default function ReportsPage() {
  const [activeRange, setActiveRange] = useState('This Week')
  const [activeView, setActiveView] = useState('Supervisor View')

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Performance and sustainability metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1">
            {dateRanges.map(r => (
              <button key={r} onClick={() => setActiveRange(r)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeRange === r ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}>{r}</button>
            ))}
          </div>
          <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block" />
          <div className="relative group">
            <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm">
              <FontAwesomeIcon icon={faDownload} />
              <span className="hidden sm:inline">Export Report</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 hidden group-hover:block z-50">
              <div className="py-1">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">Export as PDF</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">Export as CSV</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* View Toggle */}
          <div className="flex justify-end mb-2">
            <div className="inline-flex bg-gray-200 rounded-lg p-1">
              {['Supervisor View', 'Worker View'].map(v => (
                <button key={v} onClick={() => setActiveView(v)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeView === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>{v}</button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statsCards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <FontAwesomeIcon icon={card.icon} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className={`text-sm font-medium flex items-center gap-1 ${card.trendColor}`}>{card.trend}</p>
              </div>
            ))}
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Collection Volume by Day</h3>
                <button className="text-gray-400 hover:text-gray-900"><FontAwesomeIcon icon={faEllipsisVertical} /></button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Average Fill Level at Pickup</h3>
                <button className="text-gray-400 hover:text-gray-900"><FontAwesomeIcon icon={faEllipsisVertical} /></button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={fillData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg Fill']} />
                  <Area type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={3} fill="url(#fillAreaGrad)" dot={{ fill: '#3b82f6', r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Neighborhood Analytics Table */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Neighborhood Analytics (Skopje)</h3>
              <div className="relative">
                <input type="text" placeholder="Search neighborhood..." className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Neighborhood</th>
                    <th className="p-4">Total Pickups</th>
                    <th className="p-4">Avg Fill Level</th>
                    <th className="p-4">Efficiency Score</th>
                    <th className="p-4">Overflows</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {neighborhoods.map(n => (
                    <tr key={n.name} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{n.name}</td>
                      <td className="p-4 text-gray-600">{n.pickups}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div className={`${n.fillColor} h-2 rounded-full`} style={{ width: `${n.fill}%` }} />
                          </div>
                          <span className="text-sm text-gray-600">{n.fill}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{n.score}/100</td>
                      <td className="p-4 text-gray-600">{n.overflows}</td>
                      <td className="p-4 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${n.statusStyle}`}>{n.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
