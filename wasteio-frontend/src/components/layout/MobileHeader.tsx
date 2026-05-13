import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRecycle } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function MobileHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="lg:hidden h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 z-40">
      <button onClick={() => navigate('/map')} className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-green-500/30">
          <FontAwesomeIcon icon={faRecycle} />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">Wasteio</span>
      </button>
      <button
        onClick={() => navigate('/settings')}
        className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm border-2 border-white shadow-sm"
      >
        {user ? initials(user.name) : '?'}
      </button>
    </header>
  )
}
