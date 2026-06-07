import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTriangleExclamation, faRotateLeft, faTruck, faCheck, faBolt,
  faArrowsRotate, faMicrochip, faChevronDown, faChevronUp, faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useSimDevices } from '../../hooks/useSimDevices'
import { pushDeviceConfig, clearOfflineSimDevices } from '../../lib/wasteBinAgentApi'
import { triggerPickup } from '../../lib/simulatorApi'
import type { SimulatorConfig } from '../../types/simulator'
import type { Container } from '../../types/container'
import ContainerTable from './ContainerTable'

interface Props {
  containers: Container[]
  lastJoinedContainerId?: string | null
}

interface Preset {
  label: string
  description: string
  config: SimulatorConfig | null
}

const PRESETS: Preset[] = [
  {
    label: 'Fast',
    description: 'Visible changes every few seconds — good for testing',
    config: {
      fillInterval: '1s',
      batteryInterval: '5s',
      telemetryInterval: '2s',
      fillRateMin: 5,
      fillRateMax: 10,
      batteryDrainMin: 0.5,
      batteryDrainMax: 1.0,
    },
  },
  {
    label: 'Demo',
    description: 'Noticeable but not frantic — good for presentations',
    config: {
      fillInterval: '5s',
      batteryInterval: '30s',
      telemetryInterval: '10s',
      fillRateMin: 2.0,
      fillRateMax: 5.0,
      batteryDrainMin: 0.1,
      batteryDrainMax: 0.3,
    },
  },
  {
    label: 'Realistic',
    description: 'Real-world cadence — changes over minutes and hours',
    config: {
      fillInterval: '5m',
      batteryInterval: '1h',
      telemetryInterval: '30s',
      fillRateMin: 0.1,
      fillRateMax: 0.3,
      batteryDrainMin: 0.01,
      batteryDrainMax: 0.05,
    },
  },
  {
    label: 'Custom',
    description: 'Manually configured values',
    config: null,
  },
]

const DEFAULT_CONFIG: SimulatorConfig = PRESETS[1].config!

interface FieldProps {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: 'text' | 'number'
  step?: string
}

function Field({ label, value, onChange, type = 'text', step }: FieldProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  )
}

export default function WasteBinAgentPanel({ containers, lastJoinedContainerId }: Props) {
  const { devices, loading, error, lastFetched, load } = useSimDevices()

  useEffect(() => {
    if (lastJoinedContainerId) void load()
  }, [lastJoinedContainerId, load])

  // Filter the live SSE-updated containers down to sim-registered ones only
  const simContainerIds = new Set(devices.map(d => d.containerId))
  const simContainers = containers.filter(c => simContainerIds.has(c.id))

  const [agentsCollapsed, setAgentsCollapsed] = useState(false)
  const [clearing, setClearing] = useState(false)

  const offlineCount = simContainers.filter(c => c.status === 'offline').length

  async function handleClearOffline() {
    setClearing(true)
    try {
      await clearOfflineSimDevices()
      await load()
    } finally {
      setClearing(false)
    }
  }

  const [draft, setDraft] = useState<SimulatorConfig>({ ...DEFAULT_CONFIG })
  const [lastPushed, setLastPushed] = useState<Date | null>(null)
  const [pushing, setPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  const [selectedContainerId, setSelectedContainerId] = useState('')
  const [pickupLoading, setPickupLoading] = useState(false)
  const [pickupDone, setPickupDone] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)

  const [allPickupLoading, setAllPickupLoading] = useState(false)
  const [allPickupResult, setAllPickupResult] = useState<{ success: number; total: number } | null>(null)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (devices.length > 0 && !selectedContainerId) {
      setSelectedContainerId(devices[0].containerId)
    }
  }, [devices, selectedContainerId])

  function set<K extends keyof SimulatorConfig>(key: K, raw: string) {
    setDraft(prev => {
      const isNumber = typeof prev[key] === 'number'
      return { ...prev, [key]: isNumber ? parseFloat(raw) || 0 : raw }
    })
  }

  async function handlePickup() {
    if (!selectedContainerId) return
    setPickupLoading(true)
    setPickupError(null)
    setPickupDone(false)
    try {
      await triggerPickup(selectedContainerId)
      setPickupDone(true)
      setTimeout(() => { setPickupDone(false) }, 2000)
    } catch (e) {
      setPickupError(e instanceof Error ? e.message : 'Failed to trigger pickup')
    } finally {
      setPickupLoading(false)
    }
  }

  async function handlePickupAll() {
    if (allPickupLoading || devices.length === 0) return
    setAllPickupLoading(true)
    setAllPickupResult(null)
    const results = await Promise.allSettled(devices.map(d => triggerPickup(d.containerId)))
    const success = results.filter(r => r.status === 'fulfilled').length
    setAllPickupLoading(false)
    setAllPickupResult({ success, total: devices.length })
    setTimeout(() => { setAllPickupResult(null) }, 3000)
  }

  async function handleApply() {
    if (devices.length === 0) return
    setPushing(true)
    setPushError(null)
    try {
      await Promise.all(devices.map(d => pushDeviceConfig(d.deviceId, draft)))
      setLastPushed(new Date())
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Failed to push config')
    } finally {
      setPushing(false)
    }
  }

  function applyPreset(preset: Preset) {
    if (preset.config) setDraft({ ...preset.config })
  }

  const activePreset = PRESETS.find(p => p.config && JSON.stringify(p.config) === JSON.stringify(draft))?.label ?? 'Custom'
  const allDone = allPickupResult !== null
  const allSuccess = allDone && allPickupResult!.success === allPickupResult!.total

  return (
    <div className="flex flex-col gap-6">

      {/* ── Active Agents ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-gray-900">Active Agents</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {devices.length} registered
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                Fetched at {lastFetched.toLocaleTimeString()}
              </span>
            )}
            {offlineCount > 0 && (
              <button
                onClick={handleClearOffline}
                disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} />
                Clear offline ({offlineCount})
              </button>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setAgentsCollapsed(v => !v)}
              className="w-8 h-8 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 flex items-center justify-center transition-colors"
              aria-label={agentsCollapsed ? 'Expand' : 'Collapse'}
            >
              <FontAwesomeIcon icon={agentsCollapsed ? faChevronDown : faChevronUp} className="text-xs" />
            </button>
          </div>
        </div>

        {!agentsCollapsed && (
          <div>
            {error ? (
              <div className="p-4 sm:p-6">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  {error}
                </p>
              </div>
            ) : loading && devices.length === 0 ? (
              <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-400">Loading…</p>
              </div>
            ) : simContainers.length === 0 ? (
              <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-400">
                  {devices.length === 0
                    ? 'No sim-registered agents found. Start waste-bin-agent in sim mode to see devices here.'
                    : 'Agents registered but containers not yet visible — waiting for telemetry.'}
                </p>
              </div>
            ) : (
              <ContainerTable
                containers={simContainers}
                columns={['name', 'fillLevel', 'battery', 'status']}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Simulate Pickup ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Simulate Pickup</h2>
          <p className="text-sm text-gray-500 mt-0.5">Send a pickup command to one agent's container or all at once.</p>
        </div>
        <div className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedContainerId}
              onChange={e => setSelectedContainerId(e.target.value)}
              disabled={devices.length === 0}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-40"
            >
              {devices.length === 0 ? (
                <option>No agents registered</option>
              ) : (
                devices.map(d => (
                  <option key={d.containerId} value={d.containerId}>
                    {d.containerName} — {Math.round(d.fillLevel)}% full
                  </option>
                ))
              )}
            </select>

            <button
              onClick={handlePickup}
              disabled={pickupLoading || devices.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                pickupDone
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <FontAwesomeIcon icon={pickupDone ? faCheck : faTruck} />
              {pickupLoading ? 'Sending…' : pickupDone ? 'Sent!' : 'Trigger Pickup'}
            </button>

            {pickupError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                {pickupError}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handlePickupAll}
              disabled={allPickupLoading || devices.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                allDone && allSuccess
                  ? 'bg-green-600 text-white'
                  : allDone
                  ? 'bg-amber-500 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <FontAwesomeIcon icon={allDone && allSuccess ? faCheck : faBolt} />
              {allPickupLoading
                ? 'Sending to all…'
                : allDone
                ? `${allPickupResult!.success}/${allPickupResult!.total} sent`
                : `Trigger All (${devices.length})`}
            </button>
            <p className="text-xs text-gray-400">Fires a pickup command for every registered agent simultaneously.</p>
          </div>
        </div>
      </div>

      {/* ── Simulation Parameters ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Simulation Parameters</h2>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
                Pushed to all running agents via MQTT.
                {lastPushed && (
                  <span className="ml-1 text-gray-400">Last pushed at {lastPushed.toLocaleTimeString()}.</span>
                )}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              {PRESETS.map(preset => {
                const isActive = activePreset === preset.label
                const isCustom = preset.config === null
                return (
                  <button
                    key={preset.label}
                    onClick={() => !isCustom && applyPreset(preset)}
                    disabled={isCustom}
                    title={preset.description}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-gray-900 text-white'
                      : isCustom ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-1.5 mt-3">
            {PRESETS.map(preset => {
              const isActive = activePreset === preset.label
              const isCustom = preset.config === null
              return (
                <button
                  key={preset.label}
                  onClick={() => !isCustom && applyPreset(preset)}
                  disabled={isCustom}
                  title={preset.description}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-gray-900 text-white'
                    : isCustom ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Fill Interval"      value={draft.fillInterval}      onChange={v => set('fillInterval', v)} />
              <Field label="Battery Interval"   value={draft.batteryInterval}   onChange={v => set('batteryInterval', v)} />
              <Field label="Telemetry Interval" value={draft.telemetryInterval} onChange={v => set('telemetryInterval', v)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Fill Rate Min" value={draft.fillRateMin}     onChange={v => set('fillRateMin', v)}     type="number" step="0.1" />
              <Field label="Fill Rate Max" value={draft.fillRateMax}     onChange={v => set('fillRateMax', v)}     type="number" step="0.1" />
              <Field label="Drain Min"     value={draft.batteryDrainMin} onChange={v => set('batteryDrainMin', v)} type="number" step="0.01" />
              <Field label="Drain Max"     value={draft.batteryDrainMax} onChange={v => set('batteryDrainMax', v)} type="number" step="0.01" />
            </div>
            {pushError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                {pushError}
              </p>
            )}
            <div className="flex gap-2 justify-end items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400 mr-auto flex items-center gap-1.5">
                <FontAwesomeIcon icon={faMicrochip} className="text-gray-300" />
                {devices.length === 0 ? 'No agents to push to' : `Push to ${devices.length} agent${devices.length > 1 ? 's' : ''}`}
              </span>
              <button
                onClick={() => setDraft({ ...DEFAULT_CONFIG })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faRotateLeft} />
                Reset
              </button>
              <button
                onClick={handleApply}
                disabled={pushing || devices.length === 0}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pushing ? 'Pushing…' : 'Push to Agents'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
