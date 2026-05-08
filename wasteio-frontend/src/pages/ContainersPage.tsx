import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faMagnifyingGlass, faBox, faCircleCheck,
  faTriangleExclamation, faBan, faToggleOn, faToggleOff, faSliders,
} from '@fortawesome/free-solid-svg-icons'
import { useContainers } from '../hooks/useContainers'
import ContainerTable from '../components/containers/ContainerTable'
import ContainerFormModal from '../components/containers/ContainerFormModal'
import DeleteConfirmModal from '../components/containers/DeleteConfirmModal'
import SimulatorPanel from '../components/containers/SimulatorPanel'
import type { Container, ContainerFormData, ContainerStatus, WasteType } from '../types/container'

interface StatCardProps {
  label: string
  value: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  iconClass: string
}

function StatCard({ label, value, icon, iconClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function ContainersPage() {
  const { containers, loading, error, isDemo, toggleDemo, createContainer, updateContainer, deleteContainer } = useContainers()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ContainerStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<WasteType | 'all'>('all')

  const [showSimulator, setShowSimulator] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Container | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Container | null>(null)

  const filtered = useMemo(() => containers.filter(c => {
    const q = search.toLowerCase()
    const matchesSearch = !q || c.id.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    const matchesType = filterType === 'all' || c.wasteType === filterType
    return matchesSearch && matchesStatus && matchesType
  }), [containers, search, filterStatus, filterType])

  const stats = useMemo(() => ({
    total: containers.length,
    active: containers.filter(c => c.status === 'active').length,
    critical: containers.filter(c => c.fillLevel >= 80).length,
    offline: containers.filter(c => c.status === 'offline').length,
  }), [containers])

  async function handleCreate(data: ContainerFormData) {
    await createContainer(data)
    setShowCreateModal(false)
  }

  async function handleUpdate(data: ContainerFormData) {
    if (!editTarget) return
    await updateContainer(editTarget.id, data)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteContainer(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className={`flex-1 h-full flex flex-col bg-gray-100 overflow-y-auto transition-all duration-300 ${showSimulator ? 'pb-52' : 'pb-11'}`}>
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-4 mt-4 lg:mx-6 lg:mt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Containers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{containers.length} containers in this jurisdiction</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Demo / Live toggle */}
          <button
            onClick={toggleDemo}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isDemo
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            }`}
          >
            <FontAwesomeIcon icon={isDemo ? faToggleOff : faToggleOn} className="text-sm" />
            {isDemo ? 'Demo' : 'Live'}
          </button>

          <div className="relative bg-gray-50 rounded-xl flex items-center p-2 border border-gray-200 w-64 hidden md:flex">
            <div className="pl-2 text-gray-400">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </div>
            <input
              type="text"
              placeholder="Search by ID or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-1 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowSimulator(s => !s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              showSimulator
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon icon={faSliders} />
            Simulator
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl shadow-md text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} /> Add Container
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-6 flex flex-col gap-6 pb-8">
        {/* API error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Containers"   value={stats.total}    icon={faBox}                iconClass="bg-gray-100 text-gray-600" />
          <StatCard label="Active"             value={stats.active}   icon={faCircleCheck}        iconClass="bg-green-50 text-green-600" />
          <StatCard label="Critical Fill ≥80%" value={stats.critical} icon={faTriangleExclamation} iconClass="bg-red-50 text-red-600" />
          <StatCard label="Offline"            value={stats.offline}  icon={faBan}                iconClass="bg-gray-100 text-gray-500" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
            {/* Mobile search */}
            <div className="relative md:hidden flex-1 min-w-[160px]">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as ContainerStatus | 'all')}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as WasteType | 'all')}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="recycling">Recycling</option>
                <option value="organic">Organic</option>
                <option value="hazardous">Hazardous</option>
              </select>
              <span className="text-xs text-gray-400 font-medium hidden sm:block">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <ContainerTable
            containers={filtered}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      {showCreateModal && (
        <ContainerFormModal
          key="create"
          container={null}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
        />
      )}
      {editTarget && (
        <ContainerFormModal
          key={editTarget.id}
          container={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          loading={loading}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          container={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={loading}
        />
      )}

      <SimulatorPanel open={showSimulator} onToggle={() => setShowSimulator(s => !s)} />
    </div>
  )
}
