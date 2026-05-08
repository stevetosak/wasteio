import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Container, ContainerFormData, WasteType, ContainerStatus } from '../../types/container'

interface Props {
  container: Container | null
  onClose: () => void
  onSubmit: (data: ContainerFormData) => Promise<void>
  loading: boolean
}

const EMPTY_FORM: ContainerFormData = {
  name: '',
  address: '',
  wasteType: 'general',
  capacityLiters: 1100,
  status: 'active',
  location: { lat: 41.9981, lng: 21.4254 },
}

export default function ContainerFormModal({ container, onClose, onSubmit, loading }: Props) {
  const [form, setForm] = useState<ContainerFormData>(EMPTY_FORM)
  const isEdit = !!container

  useEffect(() => {
    if (container) {
      setForm({
        name: container.name,
        address: container.address,
        wasteType: container.wasteType,
        capacityLiters: container.capacityLiters,
        status: container.status,
        location: container.location,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [container])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Container' : 'Add New Container'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Container C-XXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street, District"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Waste Type</label>
              <select
                value={form.wasteType}
                onChange={e => setForm(prev => ({ ...prev, wasteType: e.target.value as WasteType }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="general">General</option>
                <option value="recycling">Recycling</option>
                <option value="organic">Organic</option>
                <option value="hazardous">Hazardous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as ContainerStatus }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Capacity (L)</label>
              <input
                type="number"
                required
                min={1}
                value={form.capacityLiters}
                onChange={e => setForm(prev => ({ ...prev, capacityLiters: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div />

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={form.location.lat}
                onChange={e => setForm(prev => ({ ...prev, location: { ...prev.location, lat: Number(e.target.value) } }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={form.location.lng}
                onChange={e => setForm(prev => ({ ...prev, location: { ...prev.location, lng: Number(e.target.value) } }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}