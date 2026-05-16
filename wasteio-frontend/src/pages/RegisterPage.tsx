import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRecycle, faEnvelope, faLock, faEyeSlash, faEye, faUser, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()

  const token = searchParams.get('token') ?? ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(token, name, email, password)
      navigate('/signin?registered=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. The token may be invalid or already used.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid invitation link</h1>
          <p className="text-gray-500 text-sm mb-6">
            This link is missing a registration token. Ask your admin for a valid invitation link.
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-[1440px] min-h-[900px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Register Form */}
        <section className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-20 flex flex-col justify-between relative z-10 bg-white">
          <header className="mb-12">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
                <FontAwesomeIcon icon={faRecycle} className="text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Wasteio</span>
            </button>
          </header>

          <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create your account</h1>
              <p className="text-gray-500 text-base">You've been invited to join Wasteio.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <input
                    type="text" id="name" placeholder="Marko Kovač"
                    value={name} onChange={e => setName(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-gray-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <input
                    type="email" id="email" placeholder="worker@wasteio.app"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-gray-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FontAwesomeIcon icon={faLock} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-gray-50/50 hover:bg-white focus:bg-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>

          <footer className="mt-12 pt-8 flex items-center justify-between text-sm text-gray-500">
            <p>&copy; 2026 Wasteio</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-green-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
            </div>
          </footer>
        </section>

        {/* Right: Visual Panel */}
        <section className="hidden lg:flex w-1/2 bg-gray-900 relative p-12 flex-col justify-between overflow-hidden rounded-r-[2rem]">
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-green-900/60" />

          <div className="relative z-10 flex justify-end">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white">System Status: Optimal</span>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col justify-center gap-4">
            {[
              { label: 'Real-time container monitoring', sub: 'Live fill levels across all zones' },
              { label: 'Optimized pickup routing', sub: 'AI-driven route efficiency' },
              { label: 'Fleet & driver coordination', sub: 'Unified operations dashboard' },
            ].map(({ label, sub }) => (
              <div key={label} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:-translate-y-0.5 transition-transform duration-300 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                <div>
                  <p className="text-white font-semibold">{label}</p>
                  <p className="text-gray-400 text-sm">{sub}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 text-left">
              <h2 className="text-3xl font-bold text-white mb-3">Join the team keeping<br />Skopje clean</h2>
              <p className="text-gray-300 leading-relaxed">
                Your account gives you access to live container data, route assignments, and city-wide waste operations.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 border-t border-white/10 pt-6">
            <div className="flex -space-x-3">
              {['#16a34a', '#15803d', '#166534'].map((c, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                  {['MK', 'AL', 'SB'][i]}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">Join 200+ active workers</p>
              <p className="text-gray-400">Making the city cleaner daily</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
