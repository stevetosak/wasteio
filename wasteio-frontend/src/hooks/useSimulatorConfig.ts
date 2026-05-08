import { useState, useCallback } from 'react'
import type { SimulatorConfig } from '../types/simulator'
import { fetchSimulatorConfig, updateSimulatorConfig } from '../lib/simulatorApi'

export function useSimulatorConfig() {
  const [config, setConfig] = useState<SimulatorConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setConfig(await fetchSimulatorConfig())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reach simulator')
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (patch: Partial<SimulatorConfig>) => {
    setLoading(true)
    setError(null)
    try {
      setConfig(await updateSimulatorConfig(patch))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update simulator config')
    } finally {
      setLoading(false)
    }
  }, [])

  return { config, loading, error, load, update }
}
