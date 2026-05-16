import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRecycle, faChartPie, faRoute, faArrowRight, faCircleQuestion, faLocationDot } from '@fortawesome/free-solid-svg-icons'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <main className="w-full max-w-[1440px] min-h-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Content */}
        <section className="w-full lg:w-5/12 p-8 lg:p-16 flex flex-col justify-center relative z-10 bg-white">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <FontAwesomeIcon icon={faRecycle} className="text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wasteio</h1>
          </div>

          <div className="space-y-6 mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Smart Waste Management System
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Optimize Routes.<br />
              <span className="text-green-600">Cleaner City.</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Real-time IoT monitoring for waste containers across Skopje. Track fill levels instantly and generate efficient, eco-friendly pickup routes for your fleet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-green-600 shrink-0">
                <FontAwesomeIcon icon={faChartPie} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Live Fill Levels</h3>
                <p className="text-xs text-gray-500">Monitor empty, moderate, and full containers instantly.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-green-600 shrink-0">
                <FontAwesomeIcon icon={faRoute} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Smart Routing</h3>
                <p className="text-xs text-gray-500">AI-generated paths to minimize fuel and time.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
            <button
              onClick={() => navigate('/signin')}
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg shadow-green-600/20 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              Sign In to Dashboard
              <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button   onClick={() => navigate('/learn-more')} className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faCircleQuestion} className="text-gray-400" />
              Learn More
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <p>&copy; 2026 Wasteio</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-green-600 transition-colors">Help</a>
              <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
            </div>
          </div>
        </section>

        {/* Right: Visual */}
        <section className="w-full lg:w-7/12 bg-gray-100 relative overflow-hidden hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-gray-900/40" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900">Active Fleet Routing</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Live</span>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">T</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Truck #42 - Center District</h4>
                    <p className="text-sm text-gray-500">En route to Container 8A</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-semibold text-green-600">85% Full</div>
                    <div className="text-xs text-gray-400">Next stop</div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started 06:00 AM</span>
                  <span>12/18 Collected</span>
                </div>
              </div>
              <div className="h-48 rounded-xl bg-gray-100 border border-gray-100 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-400 text-sm">Map area</div>
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md animate-bounce" />
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md" />
                <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
              </div>
            </div>
          </div>
          <div className="absolute top-8 right-8 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2">
            <FontAwesomeIcon icon={faLocationDot} className="text-green-600" />
            <span className="text-sm font-medium text-gray-800">Skopje Region</span>
          </div>
        </section>
      </main>
    </div>
  )
}
