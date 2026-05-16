import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlask } from '@fortawesome/free-solid-svg-icons'
import { useContainers } from '../hooks/useContainers'
import SimulatorPanel from '../components/containers/SimulatorPanel'

export default function SimulatorPage() {
  const { containers, refreshContainer } = useContainers()

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto">
      <header className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:py-0 sm:h-20 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
          <FontAwesomeIcon icon={faFlask} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Simulator</h1>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex-shrink-0">
              Admin only
            </span>
          </div>
          <p className="text-sm text-gray-500 hidden sm:block">Control simulation parameters and trigger test events</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">
        <SimulatorPanel containers={containers} onPickup={refreshContainer} />
      </div>
    </div>
  )
}
