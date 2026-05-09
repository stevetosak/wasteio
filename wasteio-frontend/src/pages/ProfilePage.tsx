import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser, faEnvelope, faShieldHalved, faKey, faCheck,
    faEye, faEyeSlash, faSpinner, faPen,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../lib/authApi'

const AUTH_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api')
    .replace(/\/api$/, '')

async function authPost<T>(path: string, params: Record<string, string>): Promise<T> {
    const token = getStoredToken()
    const res = await fetch(`${AUTH_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams(params),
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed (${res.status})`)
    }
    return res.json() as Promise<T>
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function roleBadgeClass(role: string) {
    return role === 'ADMIN'
        ? 'bg-purple-100 text-purple-700'
        : 'bg-blue-100 text-blue-700'
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <FontAwesomeIcon icon={icon} className="text-xs" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
            </div>
        </div>
    )
}

function PasswordSection({ email }: { email: string }) {
    const [current, setCurrent]         = useState('')
    const [next, setNext]               = useState('')
    const [confirm, setConfirm]         = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNext, setShowNext]       = useState(false)
    const [loading, setLoading]         = useState(false)
    const [success, setSuccess]         = useState(false)
    const [error, setError]             = useState<string | null>(null)

    function strength(p: string): number {
        let s = 0
        if (p.length >= 8)           s++
        if (/[A-Z]/.test(p))         s++
        if (/[0-9]/.test(p))         s++
        if (/[^A-Za-z0-9]/.test(p))  s++
        return s
    }

    const lvl      = strength(next)
    const barColor = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-400'][lvl]
    const barLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][lvl]

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        if (next.length < 8) { setError('New password must be at least 8 characters.'); return }
        if (next !== confirm) { setError('Passwords do not match.'); return }

        setLoading(true)
        try {
            const token = getStoredToken()
            const res = await fetch(`${AUTH_BASE}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: new URLSearchParams({ email, currentPassword: current, newPassword: next }),
            })
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || `Request failed (${res.status})`)
            }
            setSuccess(true)
            setCurrent(''); setNext(''); setConfirm('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Current password */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                    <input
                        type={showCurrent ? 'text' : 'password'}
                        value={current}
                        onChange={e => setCurrent(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pr-10 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <FontAwesomeIcon icon={showCurrent ? faEyeSlash : faEye} className="text-xs" />
                    </button>
                </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Password</label>
                <div className="relative">
                    <input
                        type={showNext ? 'text' : 'password'}
                        value={next}
                        onChange={e => setNext(e.target.value)}
                        required
                        placeholder="Min. 8 characters"
                        className="w-full pr-10 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowNext(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <FontAwesomeIcon icon={showNext ? faEyeSlash : faEye} className="text-xs" />
                    </button>
                </div>
                {next.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= lvl ? barColor : 'bg-gray-200'}`} />
                            ))}
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">{barLabel}</span>
                    </div>
                )}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirm New Password</label>
                <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition ${
                        confirm && confirm !== next ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                />
                {confirm && confirm !== next && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
                type="submit"
                disabled={loading || !current || !next || !confirm || next !== confirm}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading
                    ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    : success
                        ? <><FontAwesomeIcon icon={faCheck} className="text-green-400" /> Password updated!</>
                        : 'Update Password'}
            </button>
        </form>
    )
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [editingName, setEditingName] = useState(false)
    const [nameValue, setNameValue]     = useState(user?.name ?? '')
    const [savingName, setSavingName]   = useState(false)
    const [nameError, setNameError]     = useState<string | null>(null)

    if (!user) return null

    async function handleSaveName() {
        const trimmed = nameValue.trim()
        if (!trimmed || trimmed === user?.name) {
            setEditingName(false)
            setNameValue(user?.name ?? '')
            return
        }
        setNameError(null)
        setSavingName(true)
        try {
            await authPost('/auth/update-profile', { name: trimmed })
        } catch (err: any) {
            setNameError(err.message ?? 'Could not update name.')
            setNameValue(user?.name ?? '')
        } finally {
            setSavingName(false)
            setEditingName(false)
        }
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto">

            {/* Header */}
            <header className="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 lg:mx-6 lg:mt-6">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <FontAwesomeIcon icon={faUser} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-sm text-gray-500">View and update your account details</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8 px-4 lg:px-6">

                {/* Account info card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>

                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
                            {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        value={nameValue}
                                        onChange={e => setNameValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName() }}
                                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    <button onClick={handleSaveName} disabled={savingName}
                                            className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
                                        {savingName ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
                                    </button>
                                    <button onClick={() => { setEditingName(false); setNameValue(user.name) }}
                                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold text-gray-900 truncate">{user.name}</p>
                                    <button onClick={() => setEditingName(true)}
                                            className="text-gray-400 hover:text-gray-700 transition" title="Edit name">
                                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                                    </button>
                                </div>
                            )}
                            {nameError && <p className="text-xs text-red-500 mt-0.5">{nameError}</p>}
                            <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadgeClass(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex flex-col gap-3">
                        <InfoRow icon={faEnvelope} label="Email" value={user.email} />
                        <InfoRow icon={faShieldHalved} label="Role" value={user.role} />
                    </div>
                </div>

                {/* Change password card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                            <FontAwesomeIcon icon={faKey} className="text-sm" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                    </div>
                    <PasswordSection email={user.email} />
                </div>

            </div>
        </div>
    )
}
