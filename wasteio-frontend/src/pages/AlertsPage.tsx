import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faDownload, faTriangleExclamation, faCircleExclamation,
  faWifi, faCheckDouble, faDumpsterFire, faCarSide, faUsers, faClockRotateLeft,
  faEye, faRoute, faImage, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

const summaryCards = [
  { label: 'Critical', count: 4, icon: faTriangleExclamation, color: 'red', trend: '+2 from yesterday' },
  { label: 'Warnings', count: 8, icon: faCircleExclamation, color: 'amber', trend: 'Unchanged' },
  { label: 'Offline Sensors', count: 3, icon: faWifi, color: 'gray', trend: 'Requires maintenance' },
  { label: 'Resolved Today', count: 15, icon: faCheckDouble, color: 'green', trend: 'Great progress' },
]

const filterBtns = ['All Active', 'Critical', 'Overflow', 'Reports']
const districts = ['All', 'Centar', 'Karposh', 'Aerodrom']

const alerts = [
  {
    id: 1, icon: faDumpsterFire, iconBg: 'bg-red-100 text-red-600', title: 'Severe Overflow',
    badge: 'Critical', badgeStyle: 'bg-red-100 text-red-700',
    desc: 'Container C-1042 is at 100% capacity with reported spillage.',
    location: 'Blvd. Partizanski Odredi 14', district: 'Centar District',
    time: '10:15 AM', ago: '2h 45m ago', agoColor: 'text-red-600',
    rowBg: 'bg-red-50/30',
    actions: [
      { icon: faEye, tip: 'View Container', label: undefined, style: undefined },
      { icon: faRoute, tip: 'Add to Route', label: undefined, style: undefined },
      { icon: undefined, tip: undefined, label: 'Acknowledge', style: undefined },
    ],
  },
  {
    id: 2, icon: faCarSide, iconBg: 'bg-amber-100 text-amber-600', title: 'Blocked Access',
    badge: 'Warning', badgeStyle: 'bg-amber-100 text-amber-700',
    desc: 'Driver reported vehicle blocking container C-0892.',
    location: 'ul. Rooseveltova 33', district: 'Karposh District',
    time: '09:30 AM', ago: '3h 30m ago', agoColor: 'text-amber-600',
    rowBg: '',
    actions: [
      { icon: faEye, tip: 'View Details', label: undefined, style: undefined },
      { icon: undefined, tip: undefined, label: 'Acknowledge', style: undefined },
    ],
  },
  {
    id: 3, icon: faWifi, iconBg: 'bg-gray-100 text-gray-600', title: 'Sensor Offline',
    badge: 'System', badgeStyle: 'bg-gray-100 text-gray-700',
    desc: 'No data received from container C-2105 for 12 hours.',
    location: 'Blvd. Jane Sandanski 88', district: 'Aerodrom District',
    time: 'Yesterday, 23:00', ago: '14h ago', agoColor: 'text-gray-500',
    rowBg: '',
    actions: [
      { icon: faEye, tip: 'View Container', label: undefined, style: undefined },
      { icon: undefined, tip: undefined, label: 'Create Ticket', style: undefined },
    ],
  },
  {
    id: 4, icon: faUsers, iconBg: 'bg-blue-100 text-blue-600', title: 'Damaged Bin',
    badge: 'Warning', badgeStyle: 'bg-amber-100 text-amber-700',
    desc: "Lid is broken and won't close properly on container C-0422.",
    location: 'ul. Makedonija 12', district: 'Centar District',
    time: '08:15 AM', ago: '4h 45m ago', agoColor: 'text-gray-500',
    rowBg: '',
    actions: [
      { icon: faImage, tip: 'View Photo', label: undefined, style: undefined },
      { icon: undefined, tip: undefined, label: 'Acknowledge', style: undefined },
    ],
  },
  {
    id: 5, icon: faClockRotateLeft, iconBg: 'bg-red-100 text-red-600', title: 'Missed Pickup',
    badge: 'Critical', badgeStyle: 'bg-red-100 text-red-700',
    desc: 'Container C-1102 was skipped on scheduled route Alpha-3.',
    location: 'ul. Orce Nikolov 55', district: 'Centar District',
    time: 'Yesterday, 14:30', ago: '22h ago', agoColor: 'text-red-600',
    rowBg: 'bg-red-50/30',
    actions: [
      { icon: faRoute, tip: 'View Route', label: undefined, style: undefined },
      { icon: undefined, tip: undefined, label: 'Reschedule', style: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' },
    ],
  },
]

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('All Active')
  const [confirmModal, setConfirmModal] = useState<{show: boolean, alertId: number | null, title: string}>({show: false, alertId: null, title: ''})

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Acknowledge Alert</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to acknowledge <span className="font-medium text-gray-700">"{confirmModal.title}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({show: false, alertId: null, title: ''})}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => setConfirmModal({show: false, alertId: null, title: ''})}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts Center</h1>
          <p className="text-sm text-gray-500">Monitor and manage system notifications</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <input type="text" placeholder="Search alerts..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm" />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block" />
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <FontAwesomeIcon icon={faDownload} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {summaryCards.map(card => (
              <div key={card.label} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${
                card.color === 'red' ? 'border-red-100' : card.color === 'amber' ? 'border-amber-100' : card.color === 'green' ? 'border-green-100' : 'border-gray-200'
              }`}>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 group-hover:scale-110 transition-transform ${
                  card.color === 'red' ? 'bg-red-50' : card.color === 'amber' ? 'bg-amber-50' : card.color === 'green' ? 'bg-green-50' : 'bg-gray-50'
                }`} />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{card.count}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    card.color === 'red' ? 'bg-red-100 text-red-600' : card.color === 'amber' ? 'bg-amber-100 text-amber-600' : card.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <FontAwesomeIcon icon={card.icon} className="text-xl" />
                  </div>
                </div>
                <p className={`text-sm font-medium flex items-center gap-1 ${
                  card.color === 'red' ? 'text-red-600' : card.color === 'amber' ? 'text-amber-600' : card.color === 'green' ? 'text-green-600' : 'text-gray-500'
                }`}>{card.trend}</p>
              </div>
            ))}
          </section>

          {/* Alerts Table */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 lg:p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-semibold text-gray-500 mr-2">Filter by:</span>
                {filterBtns.map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeFilter === f ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>{f}</button>
                ))}
                <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block" />
                <select className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                  {districts.map(d => <option key={d}>{d === 'All' ? 'District: All' : d}</option>)}
                </select>
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckDouble} /> Acknowledge Selected
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-green-600" /></th>
                    <th className="p-4">Alert Details</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Time / Duration</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts.map(alert => (
                    <tr key={alert.id} className={`hover:bg-gray-50 transition-colors ${alert.rowBg}`}>
                      <td className="p-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-green-600" /></td>
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${alert.iconBg}`}>
                            <FontAwesomeIcon icon={alert.icon} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{alert.title}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${alert.badgeStyle}`}>{alert.badge}</span>
                            </div>
                            <p className="text-sm text-gray-500">{alert.desc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{alert.location}</div>
                        <div className="text-xs text-gray-500">{alert.district}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{alert.time}</div>
                        <div className={`text-xs font-medium ${alert.agoColor}`}>{alert.ago}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {alert.actions.map((action, i) => (
                            action.icon ? (
                              <button key={i} title={action.tip ?? ''} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <FontAwesomeIcon icon={action.icon} />
                              </button>
                            ) : (
                              <button key={i} onClick={() => {
                                if (action.label === 'Acknowledge') {
                                  setConfirmModal({show: true, alertId: alert.id, title: alert.title})
                                }
                              }} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                action.style ?? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                              }`}>
                                {action.label}
                              </button>
                            )
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <span className="text-sm text-gray-500">Showing 1 to 5 of 12 entries</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 disabled:opacity-50">
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
                {[1, 2, 3].map(n => (
                  <button key={n} className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm ${
                    n === 1 ? 'bg-green-50 text-green-600 border border-green-100' : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                  }`}>{n}</button>
                ))}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
