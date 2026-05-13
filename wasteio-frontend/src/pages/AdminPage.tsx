import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShieldHalved, faUserPlus, faLink, faCheck, faTrash,
  faUserTie, faUser, faCircleCheck, faClock, faFlask,
} from '@fortawesome/free-solid-svg-icons'
import {
  generateInviteToken, fetchUsers, deleteUser, fetchTokens,
  type AdminUser, type AdminToken,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

const FRONTEND_BASE = window.location.origin

function roleBadge(role: string) {
  return role === 'ADMIN'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-blue-100 text-blue-700'
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user: me } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [tokens, setTokens] = useState<AdminToken[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | 'new' | null>(null)

  const loadUsers = useCallback(() => {
    setLoadingUsers(true)
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false))
  }, [])

  const loadTokens = useCallback(() => {
    setLoadingTokens(true)
    fetchTokens()
      .then(data => setTokens([...data].reverse()))
      .finally(() => setLoadingTokens(false))
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { loadTokens() }, [loadTokens])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const token = await generateInviteToken()
      const link = `${FRONTEND_BASE}/register?token=${token}`
      await navigator.clipboard.writeText(link)
      setCopiedId('new')
      setTimeout(() => setCopiedId(null), 2500)
      loadTokens()
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(t: AdminToken) {
    const link = `${FRONTEND_BASE}/register?token=${t.token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 lg:mx-6 lg:mt-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Manage users and invitations</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/simulator')}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm font-medium rounded-xl hover:bg-purple-100 transition-colors flex-shrink-0"
        >
          <FontAwesomeIcon icon={faFlask} />
          <span className="hidden sm:inline">Simulator</span>
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8 px-4 lg:px-6">
        {/* Invite Management */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invite Management</h2>
              <p className="text-sm text-gray-500">Generate a one-time registration link</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating
                ? <Spinner size="sm" />
                : copiedId === 'new'
                  ? <FontAwesomeIcon icon={faCheck} className="text-green-400" />
                  : <FontAwesomeIcon icon={faUserPlus} />}
              {copiedId === 'new' ? 'Copied!' : 'Generate link'}
            </button>
          </div>

          {loadingTokens ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No invitations yet</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
              {tokens.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FontAwesomeIcon
                      icon={t.used ? faCircleCheck : faClock}
                      className={t.used ? 'text-green-500 shrink-0' : 'text-amber-400 shrink-0'}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-700 truncate">{t.token}</p>
                      {t.createdBy && (
                        <p className="text-xs text-gray-400">by {t.createdBy}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.used ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.used ? 'Used' : 'Pending'}
                    </span>
                    {!t.used && (
                      <button
                        onClick={() => handleCopy(t)}
                        title="Copy invite link"
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
                      >
                        <FontAwesomeIcon icon={copiedId === t.id ? faCheck : faLink} className={copiedId === t.id ? 'text-green-500 text-xs' : 'text-xs'} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Management */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500">{users.length} account{users.length !== 1 ? 's' : ''}</p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                    <FontAwesomeIcon icon={u.role === 'ADMIN' ? faUserTie : faUser} className="text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${roleBadge(u.role)}`}>
                    {u.role}
                  </span>
                  {u.email !== me?.email && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      title="Remove user"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deletingId === u.id
                        ? <Spinner size="xs" />
                        : <FontAwesomeIcon icon={faTrash} className="text-xs" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
