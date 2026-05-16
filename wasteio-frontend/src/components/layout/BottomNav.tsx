import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapLocationDot, faRoute, faTrashCan, faBell, faChartPie, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'

const baseItems = [
  { to: '/map',        icon: faMapLocationDot, label: 'Map'        },
  { to: '/routes',     icon: faRoute,          label: 'Routes'     },
  { to: '/containers', icon: faTrashCan,       label: 'Containers' },
  { to: '/alerts',     icon: faBell,           label: 'Alerts', badge: 3 },
  { to: '/reports',    icon: faChartPie,       label: 'Reports'    },
]

const adminItem = { to: '/admin', icon: faShieldHalved, label: 'Admin', badge: undefined }

export default function BottomNav() {
  const { user } = useAuth()
  const items = user?.role === 'ADMIN' ? [...baseItems, adminItem] : baseItems

  return (
    <nav className="lg:hidden h-16 bg-white border-t border-gray-100 flex items-stretch flex-shrink-0">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-green-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-green-50' : ''
                }`}>
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
