import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSliders, faChevronDown, faChevronUp, faTriangleExclamation, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { useSimulatorConfig } from '../../hooks/useSimulatorConfig'
import type { SimulatorConfig } from '../../types/simulator'

interface Props {
  open: boolean
  onToggle: () => void
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

export default function SimulatorPanel({ open, onToggle }: Props) {
  const { config, loading, error, load, update } = useSimulatorConfig()
  const [draft, setDraft] = useState<SimulatorConfig | null>(null)

  useEffect(() => {
    if (open && !config) load()
  }, [open, config, load])

  useEffect(() => {
    if (config) setDraft({ ...config })
  }, [config])

  function set<K extends keyof SimulatorConfig>(key: K, raw: string) {
    setDraft(prev => {
      if (!prev) return null
      const isNumber = typeof prev[key] === 'number'
      return { ...prev, [key]: isNumber ? parseFloat(raw) || 0 : raw }
    })
  }

  function handleApply() {
    if (draft) update(draft)
  }

  function handleReset() {
    if (config) setDraft({ ...config })
  }

  const isDirty = draft && config && JSON.stringify(draft) !== JSON.stringify(config)

  return (
    <div className="fixed bottom-0 left-20 lg:left-64 right-0 z-40">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full h-11 bg-gray-900 px-6 flex items-center gap-3 hover:bg-gray-800 transition-colors"
      >
        <FontAwesomeIcon icon={faSliders} className="text-gray-400 text-sm" />
        <span className="text-sm font-semibold text-white">Simulator</span>
        {error && (
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-400 text-xs ml-1" />
        )}
        {isDirty && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" />
        )}
        <FontAwesomeIcon
          icon={open ? faChevronDown : faChevronUp}
          className="text-gray-400 text-xs ml-auto"
        />
      </button>

      {/* Content */}
      <div className={`bg-gray-50 border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-52' : 'max-h-0'}`}>
        <div className="px-6 py-4">
          {error ? (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {error}
            </p>
          ) : !draft ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="flex items-end gap-4 flex-wrap">
              {/* Intervals */}
              <Field label="Fill Interval"      value={draft.fillInterval}      onChange={v => set('fillInterval', v)} />
              <Field label="Battery Interval"   value={draft.batteryInterval}   onChange={v => set('batteryInterval', v)} />
              <Field label="Telemetry Interval" value={draft.telemetryInterval} onChange={v => set('telemetryInterval', v)} />

              <div className="w-px self-stretch bg-gray-200 mx-1" />

              {/* Rates */}
              <Field label="Fill Rate Min" value={draft.fillRateMin} onChange={v => set('fillRateMin', v)} type="number" step="0.1" />
              <Field label="Fill Rate Max" value={draft.fillRateMax} onChange={v => set('fillRateMax', v)} type="number" step="0.1" />
              <Field label="Drain Min"     value={draft.batteryDrainMin} onChange={v => set('batteryDrainMin', v)} type="number" step="0.01" />
              <Field label="Drain Max"     value={draft.batteryDrainMax} onChange={v => set('batteryDrainMax', v)} type="number" step="0.01" />

              {/* Actions */}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleReset}
                  disabled={!isDirty || loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  disabled={!isDirty || loading}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
