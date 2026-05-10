import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faArrowRightFromBracket, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function SidebarUserCard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    if (!user) return null

    function goProfile() {
        setOpen(false)
        navigate('/profile')
    }

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div ref={ref} className="relative">
            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <button
                        onClick={goProfile}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 w-4" />
                        My Profile
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4" />
                        Log out
                    </button>
                </div>
            )}

            <button
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    open ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
            >
                <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
                    {getInitials(user.name)}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user.name}</p>
                    <p className="text-xs text-gray-400 capitalize leading-tight">{user.role.toLowerCase()}</p>
                </div>

                <FontAwesomeIcon
                    icon={faChevronUp}
                    className={`text-gray-400 text-xs shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
        </div>
    )
}
