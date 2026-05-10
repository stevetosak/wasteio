import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleQuestion, faTrafficLight, faTruck, faBuilding, faLayerGroup,
  faCity, faMap, faDownload, faTrashCan, faGlobe, faCloudArrowDown,
  faCircleInfo, faShieldHalved, faBell, faArrowRightFromBracket,
  faUser, faSliders, faChevronDown, faFlask,
} from '@fortawesome/free-solid-svg-icons'

const DEMO_KEY = 'wasteio-demo-mode'

interface ToggleProps { checked: boolean; onChange: () => void }

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}

const settingsNav = [
  { href: '#profile', icon: faUser, label: 'Profile & Role' },
  { href: '#operational', icon: faSliders, label: 'Operational Prefs' },
  { href: '#notifications', icon: faBell, label: 'Notifications' },
  { href: '#localization', icon: faGlobe, label: 'Localization' },
  { href: '#offline', icon: faCloudArrowDown, label: 'Offline Maps' },
]

export default function SettingsPage() {
  const [mapLayers, setMapLayers] = useState({ traffic: true, trucks: true, zones: false, satellite: false })
  const [notifs, setNotifs] = useState({ overflow: true, deviation: true, sensor: false })
  const [filters, setFilters] = useState({ critical: true, moderate: true, low: false })
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem(DEMO_KEY) !== 'false')

  function toggleDemo() {
    setIsDemo(prev => {
      const next = !prev
      localStorage.setItem(DEMO_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 flex justify-between items-center px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile, preferences, and system configuration</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <FontAwesomeIcon icon={faCircleQuestion} className="text-gray-400" />
          <span className="hidden sm:inline">Help & Support</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Nav */}
          <div className="hidden lg:block lg:col-span-3 space-y-1">
            {settingsNav.map((item, i) => (
              <a key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                i === 0 ? 'bg-white text-green-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}>
                <FontAwesomeIcon icon={item.icon} className="w-5 text-center" />
                <span>{item.label}</span>
              </a>
            ))}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <a href="#system" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-white hover:text-gray-900 font-medium transition-colors">
                <FontAwesomeIcon icon={faCircleInfo} className="w-5 text-center" />
                <span>System Info</span>
              </a>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors mt-2 text-left">
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-5 text-center" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 space-y-8 pb-12">
            {/* Profile */}
            <section id="profile" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Profile & Role</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal information and view your role permissions.</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative group cursor-pointer flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 font-bold text-2xl border-4 border-gray-50 shadow-sm">MK</div>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm">Edit</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', value: 'Marko Kovačević', type: 'text' },
                        { label: 'Email Address', value: 'marko.k@ecoskopje.mk', type: 'email' },
                        { label: 'Phone Number', value: '+389 70 123 456', type: 'tel' },
                      ].map(field => (
                        <div key={field.label}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          <input type={field.type} defaultValue={field.value} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 flex items-center gap-2 cursor-not-allowed">
                          <FontAwesomeIcon icon={faShieldHalved} className="text-green-500" /> Administrator
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Jurisdiction</h3>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-green-600 shadow-sm">
                            <FontAwesomeIcon icon={faCity} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Skopje - Central District</p>
                            <p className="text-xs text-gray-500">Full access to map and routes</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-colors">Switch</button>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-sm transition-colors">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Operational Preferences */}
            <section id="operational" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Operational Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">Configure how maps, routes, and filters display by default.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Mode</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faFlask} className="text-gray-400 w-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Demo Mode</p>
                        <p className="text-xs text-gray-500">
                          {isDemo ? 'Using local mock data — no API calls are made.' : 'Using live data from the API and telemetry stream.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDemo ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {isDemo ? 'Demo' : 'Live'}
                      </span>
                      <Toggle checked={isDemo} onChange={toggleDemo} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Default Map Layers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'traffic' as const, icon: faTrafficLight, label: 'Live Traffic Data' },
                      { key: 'trucks' as const, icon: faTruck, label: 'Active Trucks' },
                      { key: 'zones' as const, icon: faBuilding, label: 'Neighborhood Zones' },
                      { key: 'satellite' as const, icon: faLayerGroup, label: 'Satellite View' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon icon={item.icon} className="text-gray-400 w-5" />
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <Toggle checked={mapLayers[item.key]} onChange={() => setMapLayers(p => ({ ...p, [item.key]: !p[item.key] }))} />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Default Container Filters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: 'critical' as const, label: 'Critical (>90%)', color: 'bg-red-500', width: '100%' },
                      { key: 'moderate' as const, label: 'Moderate (50-90%)', color: 'bg-amber-500', width: '70%' },
                      { key: 'low' as const, label: 'Low (<50%)', color: 'bg-green-500', width: '30%' },
                    ].map(item => (
                      <div key={item.key} className="border border-gray-200 rounded-xl p-4">
                        <label className="flex items-center gap-3 mb-2 cursor-pointer">
                          <input type="checkbox" checked={filters[item.key]} onChange={() => setFilters(p => ({ ...p, [item.key]: !p[item.key] }))} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 accent-green-600" />
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </label>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                          <div className={`${item.color} h-1.5 rounded-full`} style={{ width: item.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications + Offline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section id="notifications" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { key: 'overflow' as const, title: 'Container Overflows', desc: 'Alerts when a container hits 100%' },
                    { key: 'deviation' as const, title: 'Route Deviations', desc: 'When a truck leaves assigned route' },
                    { key: 'sensor' as const, title: 'Sensor Offline', desc: 'IoT sensor connectivity drops' },
                  ].map((item, i) => (
                    <div key={item.key}>
                      {i > 0 && <div className="w-full h-px bg-gray-100" />}
                      <label className="flex items-center justify-between cursor-pointer mt-4 first:mt-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <Toggle checked={notifs[item.key]} onChange={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key] }))} />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section id="offline" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Offline Maps</h2>
                </div>
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-3">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Download for offline use</p>
                      <p className="text-xs text-blue-700 mt-1">Ensure drivers have route access even in poor cellular coverage areas.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faMap} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Skopje Central</p>
                          <p className="text-xs text-gray-500">Downloaded • 45 MB</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faMap} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Skopje Outskirts</p>
                          <p className="text-xs text-gray-500">Not downloaded • Est. 82 MB</p>
                        </div>
                      </div>
                      <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-green-600 hover:bg-green-50 transition-colors shadow-sm">
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Localization + System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section id="localization" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Localization</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Language', options: ['English (US)', 'Macedonian (Македонски)', 'Albanian (Shqip)'] },
                    { label: 'Measurement Units', options: ['Metric (Kilometers, Liters)', 'Imperial (Miles, Gallons)'] },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <div className="relative">
                        <select className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 appearance-none bg-white">
                          {field.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="system" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">System Info</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      ['App Version', 'v2.4.1 (Build 842)'],
                      ['Last Sync', 'Today, 09:42 AM'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-900">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">API Status</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                      </span>
                    </div>
                    <div className="pt-2">
                      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors shadow-sm">
                        Check for Updates
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
