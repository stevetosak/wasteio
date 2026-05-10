import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTriangleExclamation, faRotateLeft, faTruck, faCheck, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import { useSimulatorConfig } from '../../hooks/useSimulatorConfig'
import { triggerPickup } from '../../lib/simulatorApi'
import type { SimulatorConfig } from '../../types/simulator'
import type { Container } from '../../types/container'

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

interface Props {
  containers: Container[]
  onPickup: (id: string) => Promise<void>
}

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


export default function SimulatorPanel({ containers, onPickup }: Props) {
  const { config, loading, error, load, update } = useSimulatorConfig()
  const [draft, setDraft] = useState<SimulatorConfig | null>(null)

  const [selectedId, setSelectedId] = useState('')
  const [pickupLoading, setPickupLoading] = useState(false)
  const [pickupDone, setPickupDone] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)

  const [allPickupLoading, setAllPickupLoading] = useState(false)
  const [allPickupResult, setAllPickupResult] = useState<{ success: number; total: number } | null>(null)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (config) setDraft({ ...config })
  }, [config])

  useEffect(() => {
    if (containers.length > 0 && !selectedId) setSelectedId(containers[0].id)
  }, [containers, selectedId])

  function set<K extends keyof SimulatorConfig>(key: K, raw: string) {
    setDraft(prev => {
      if (!prev) return null
      const isNumber = typeof prev[key] === 'number'
      return { ...prev, [key]: isNumber ? parseFloat(raw) || 0 : raw }
    })
  }

  async function handlePickup() {
    if (!selectedId) return
    setPickupLoading(true)
    setPickupError(null)
    setPickupDone(false)
    try {
      await triggerPickup(selectedId)
      await onPickup(selectedId)
      setPickupDone(true)
      setTimeout(() => setPickupDone(false), 2000)
    } catch (e) {
      setPickupError(e instanceof Error ? e.message : 'Failed to trigger pickup')
    } finally {
      setPickupLoading(false)
    }
  }

  async function handlePickupAll() {
    if (allPickupLoading || containers.length === 0) return
    setAllPickupLoading(true)
    setAllPickupResult(null)
    const results = await Promise.allSettled(
      containers.map(c => triggerPickup(c.id).then(() => onPickup(c.id)))
    )
    const success = results.filter(r => r.status === 'fulfilled').length
    setAllPickupLoading(false)
    setAllPickupResult({ success, total: containers.length })
    setTimeout(() => setAllPickupResult(null), 3000)
  }

  function handleApply() {
    if (draft) update(draft)
  }

  function handleReset() {
    if (config) setDraft({ ...config })
  }

  const isDirty = draft && config && JSON.stringify(draft) !== JSON.stringify(config)

  const activePreset = draft
    ? (PRESETS.find(p => p.config && JSON.stringify(p.config) === JSON.stringify(draft))?.label ?? 'Custom')
    : null

  function applyPreset(preset: Preset) {
    if (preset.config) setDraft({ ...preset.config })
  }

  const allDone = allPickupResult !== null
  const allSuccess = allDone && allPickupResult!.success === allPickupResult!.total

  return (
    <div className="flex flex-col gap-6">

      {/* ── Simulate Pickup ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Simulate Pickup</h2>
          <p className="text-sm text-gray-500 mt-0.5">Send a pickup event to one container or all at once.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {containers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {Math.round(c.fillLevel)}% full
                </option>
              ))}
            </select>

            <button
              onClick={handlePickup}
              disabled={pickupLoading || !selectedId}
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

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handlePickupAll}
              disabled={allPickupLoading || containers.length === 0}
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
                : `Trigger All Pickups (${containers.length})`}
            </button>
            <p className="text-xs text-gray-400">Fires a pickup event for every container simultaneously.</p>
          </div>
        </div>
      </div>

      {/* ── Simulation Parameters ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Simulation Parameters</h2>
            <p className="text-sm text-gray-500 mt-0.5">Set fill and battery rates for the running simulator.</p>
          </div>
          <div className="flex items-center gap-1.5">
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
                    isActive
                      ? 'bg-gray-900 text-white'
                      : isCustom
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-6">
          {error ? (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {error}
            </p>
          ) : !draft ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
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
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 self-center mr-1" />}
                <button
                  onClick={handleReset}
                  disabled={!isDirty || loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  disabled={!isDirty || loading}
                  className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Applying…' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
