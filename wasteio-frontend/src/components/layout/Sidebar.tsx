import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLeaf, faMapLocationDot, faRoute, faTrashCan, faBell,
  faChartPie, faGear, faShieldHalved, faArrowRightFromBracket,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/map', icon: faMapLocationDot, label: 'Map Overview' },
  { to: '/routes', icon: faRoute, label: 'Pickup Routes' },
  { to: '/containers', icon: faTrashCan, label: 'Containers' },
  { to: '/alerts', icon: faBell, label: 'Alerts', badge: 3 },
  { to: '/reports', icon: faChartPie, label: 'Reports' },
]

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/signin')
  }

  return (
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0 z-50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">

        {/* Logo */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-50 flex-shrink-0">
          <button onClick={() => navigate('/map')} className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faLeaf} className="text-xl" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden lg:block">EcoSkopje</span>
          </button>
        </div>

        {/* User Profile — clickable, navigates to /settings */}
        <div className="p-4 border-b border-gray-50 hidden lg:block">
          <NavLink
              to="/settings"
              className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-xl border transition-colors ${
                      isActive
                          ? 'bg-green-50 border-green-100'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`
              }
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm border-2 border-white shadow-sm shrink-0">
              {user ? initials(user.name) : '?'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? '—'}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.toLowerCase() ?? ''}</p>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-xs shrink-0" />
          </NavLink>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 lg:px-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3 hidden lg:block">Menu</div>
          {navItems.map((item) => (
              <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors group ${
                          isActive
                              ? 'bg-green-50 text-green-600 border border-green-100'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`
                  }
              >
                {({ isActive }) => (
                    <>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isActive ? 'bg-green-500 text-white shadow-md' : 'group-hover:bg-white group-hover:shadow-sm'
                      }`}>
                        <FontAwesomeIcon icon={item.icon} />
                      </div>
                      <span className="hidden lg:block flex-1">{item.label}</span>
                      {item.badge && (
                          <span className="hidden lg:flex items-center justify-center bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                      )}
                    </>
                )}
              </NavLink>
          ))}

          {/* Admin link — only visible to admins */}
          {user?.role === 'ADMIN' && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3 hidden lg:block">Admin</div>
                <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors group ${
                            isActive
                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                  {({ isActive }) => (
                      <>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isActive ? 'bg-purple-500 text-white shadow-md' : 'group-hover:bg-white group-hover:shadow-sm'
                        }`}>
                          <FontAwesomeIcon icon={faShieldHalved} />
                        </div>
                        <span className="hidden lg:block">Admin Panel</span>
                      </>
                  )}
                </NavLink>
              </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-50 flex flex-col gap-1">
          <NavLink
              to="/settings"
              className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors group ${
                      isActive ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
              }
          >
            {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? 'bg-green-500 text-white shadow-md' : 'group-hover:bg-white group-hover:shadow-sm'
                  }`}>
                    <FontAwesomeIcon icon={faGear} />
                  </div>
                  <span className="hidden lg:block">Settings</span>
                </>
            )}
          </NavLink>

          <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors text-gray-500 hover:bg-red-50 hover:text-red-600 group w-full"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-white group-hover:shadow-sm">
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </div>
            <span className="hidden lg:block">Log out</span>
          </button>
        </div>

      </aside>
  )
}
