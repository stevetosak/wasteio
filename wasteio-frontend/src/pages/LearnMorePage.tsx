import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLeaf, faArrowRight, faChartPie, faRoute, faBell, faClockRotateLeft,
  faShieldHalved, faMobileScreen,
} from '@fortawesome/free-solid-svg-icons'

const features = [
  {
    icon: faChartPie,
    title: 'Live Fill Levels',
    desc: 'Monitor empty, moderate, and full containers in real-time via IoT sensors.',
  },
  {
    icon: faRoute,
    title: 'Smart Routing',
    desc: 'Automatically generate optimal pickup routes based on container fill levels.',
  },
  {
    icon: faBell,
    title: 'Notifications',
    desc: 'Get instant alerts when containers reach critical fill levels.',
  },
  {
    icon: faClockRotateLeft,
    title: 'History Tracking',
    desc: 'View full collection history with dates, times, and container details.',
  },
  {
    icon: faShieldHalved,
    title: 'Role-based Access',
    desc: 'Admins manage users and containers. Workers see their assigned routes.',
  },
  {
    icon: faMobileScreen,
    title: 'Works Everywhere',
    desc: 'Accessible from any device via web browser, no installation needed.',
  },
]

export default function LearnMorePage() {
  const navigate = useNavigate()

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-[1440px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 lg:p-16 border-b border-gray-100">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 group mb-12">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faLeaf} className="text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">EcoSkopje</span>
          </button>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Smart Waste Management System
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            How EcoSkopje<br />
            <span className="text-green-600">Works</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
            EcoSkopje is a smart waste management platform built for municipal services in Skopje.
            Real-time IoT sensors track container fill levels and the system automatically generates
            optimal collection routes.
          </p>
        </div>

        {/* Features */}
        <div className="p-8 lg:p-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map(feature => (
              <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-green-200 hover:bg-green-50/30 transition-all">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-green-600 mb-4">
                  <FontAwesomeIcon icon={feature.icon} className="text-lg" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to get started?</h3>
              <p className="text-gray-400">Sign in to your account and start optimizing waste collection.</p>
            </div>
            <button
              onClick={() => navigate('/signin')}
              className="flex-shrink-0 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 group"
            >
              Sign In to Dashboard
              <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="px-8 lg:px-16 pb-8 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-6">
          <p>&copy; 2024 EcoSkopje</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-green-600 transition-colors">Help</a>
            <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
          </div>
        </div>
      </main>
    </div>
  )
}