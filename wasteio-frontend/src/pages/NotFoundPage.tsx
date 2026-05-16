import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRecycle, faTriangleExclamation, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 mb-12 group">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faRecycle} className="text-xl" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">Wasteio</span>
        </button>

        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-4xl text-red-400" />
        </div>

        <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl font-semibold text-gray-700 mb-2">Page not found</p>
        <p className="text-gray-500 mb-10">The page you're looking for doesn't exist or has been moved.</p>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Go back
        </button>
      </div>
    </div>
  )
}