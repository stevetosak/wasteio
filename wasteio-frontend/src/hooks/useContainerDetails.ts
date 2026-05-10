import { useState, useEffect } from 'react'
import { getContainerByIdApi, fetchFillHistory, type FillSnapshot } from '../lib/containerApi'
import type { Container } from '../types/container'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

export function useContainerDetails(id: string) {
  const [container, setContainer] = useState<Container | null>(null)
  const [fillHistory, setFillHistory] = useState<FillSnapshot[]>([])
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getContainerByIdApi(id)
      .then(c => { if (!cancelled) setContainer(c) })
      .catch(e => { if (!cancelled) setError((e as Error).message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchFillHistory(id, days)
      .then(setFillHistory)
      .catch(() => setFillHistory([]))
  }, [id, days])

  useEffect(() => {
    if (!id) return
    const source = new EventSource(`${BASE}/telemetry/stream`)

    source.onmessage = (event: MessageEvent) => {
      const { containerId, fillLevel, batteryLevel } = JSON.parse(event.data as string)
      if (containerId !== id) return
      setContainer(prev => prev ? { ...prev, fillLevel, batteryLevel } : prev)
    }

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setError('Telemetry stream disconnected')
      }
    }

    return () => source.close()
  }, [id])

  return { container, fillHistory, days, setDays, loading, error }
}
