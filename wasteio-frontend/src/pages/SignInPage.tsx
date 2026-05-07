import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLeaf, faEnvelope, faLock, faEyeSlash, faEye, faRoute,
} from '@fortawesome/free-solid-svg-icons'
import { faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons'

export default function SignInPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/jurisdiction')
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-[1440px] min-h-[900px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Login Form */}
        <section className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-20 flex flex-col justify-between relative z-10 bg-white">
          <header className="mb-12">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
                <FontAwesomeIcon icon={faLeaf} className="text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">EcoSkopje</span>
            </button>
          </header>

          <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome back</h1>
              <p className="text-gray-500 text-base">Sign in to your account to manage operations.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <input
                    type="text" id="email" placeholder="worker@ecoskopje.mk"
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
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-gray-50/50 hover:bg-white focus:bg-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input id="remember" type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer accent-green-600" />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer">Remember for 30 days</label>
                </div>
                <a href="#" className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors">Forgot password?</a>
              </div>

              <button type="submit" className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mt-6">
                Sign in
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FontAwesomeIcon icon={faGoogle} className="text-red-500 mr-2" />
                  Google
                </button>
                <button type="button" className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FontAwesomeIcon icon={faMicrosoft} className="text-blue-500 mr-2" />
                  Microsoft
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Need an account?{' '}
              <a href="#" className="font-medium text-green-600 hover:text-green-500 transition-colors">Contact admin</a>
            </p>
          </div>

          <footer className="mt-12 pt-8 flex items-center justify-between text-sm text-gray-500">
            <p>&copy; 2024 EcoSkopje</p>
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

          <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col justify-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl mb-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                  <FontAwesomeIcon icon={faRoute} className="text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Smart Route Active</h3>
                  <p className="text-gray-300 text-sm">Zone B - Centar District</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Containers to collect</span>
                  <span className="text-white font-medium">12 / 45</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-400">Est. completion: 14:30</span>
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded">On Time</span>
                </div>
              </div>
            </div>

            <div className="text-left">
              <h2 className="text-3xl font-bold text-white mb-4">Optimizing Skopje's<br />Waste Management</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Access real-time container fill levels, automated optimal routing, and fleet tracking all from your worker dashboard.
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
