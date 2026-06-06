import { useState, useCallback } from 'react'
import type { SimDevice } from '../types/simDevice'
import { fetchSimDevices } from '../lib/wasteBinAgentApi'

export function useSimDevices() {
  const [devices, setDevices] = useState<SimDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDevices(await fetchSimDevices())
      setLastFetched(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sim devices')
    } finally {
      setLoading(false)
    }
  }, [])

  return { devices, loading, error, lastFetched, load }
}
