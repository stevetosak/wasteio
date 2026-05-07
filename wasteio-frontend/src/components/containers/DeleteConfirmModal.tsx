import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Container } from '../../types/container'

interface Props {
  container: Container
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
}

export default function DeleteConfirmModal({ container, onClose, onConfirm, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Delete Container</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Are you sure?</p>
              <p className="text-sm text-gray-500">
                This will permanently delete <strong className="text-gray-800">{container.name}</strong> at {container.address}. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}