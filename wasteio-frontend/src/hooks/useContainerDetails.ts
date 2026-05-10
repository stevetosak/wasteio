import { useEffect, useMemo, useState } from 'react'
import { getContainerByIdApi, fetchFillHistory, type FillSnapshot } from '../lib/containerApi'
import type { Container } from '../types/container'
import { useContainers } from './useContainers'
import { envConfig } from '../config/env'

interface LiveDetailsState {
  id: string
  container: Container | null
  error: string
}

interface LiveHistoryState {
  days: number
  data: FillSnapshot[]
  id: string
}

function demoHistory(container: Container | undefined, days: number): FillSnapshot[] {
  if (!container) return []
  const today = new Date()
  const currentFill = Math.round(container.fillLevel ?? 0)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - index - 1))
    const drift = (index - days + 1) * 3
    const fillLevel = Math.max(0, Math.min(100, currentFill + drift))

    return {
      date: date.toISOString().slice(0, 10),
      fillLevel,
    }
  })
}

export function useContainerDetails(id: string) {
  const { containers, loading: containersLoading, error: containersError, isDemo } = useContainers()
  const [days, setDays] = useState(7)
  const [liveDetails, setLiveDetails] = useState<LiveDetailsState>({ id: '', container: null, error: '' })
  const [liveHistory, setLiveHistory] = useState<LiveHistoryState>({ id: '', days: 0, data: [] })

  const listedContainer = useMemo(
    () => containers.find(c => c.id === id),
    [containers, id]
  )

  const demoFillHistory = useMemo(
    () => demoHistory(listedContainer, days),
    [days, listedContainer]
  )

  useEffect(() => {
    if (!id || isDemo || listedContainer) return

    let cancelled = false
    getContainerByIdApi(id)
      .then(container => {
        if (!cancelled) setLiveDetails({ id, container, error: '' })
      })
      .catch(error => {
        if (!cancelled) {
          setLiveDetails({
            id,
            container: null,
            error: error instanceof Error ? error.message : 'Container not found',
          })
        }
      })

    return () => { cancelled = true }
  }, [id, isDemo, listedContainer])

  useEffect(() => {
    if (!id || isDemo) return

    let cancelled = false
    fetchFillHistory(id, days)
      .then(data => {
        if (!cancelled) setLiveHistory({ id, days, data })
      })
      .catch(() => {
        if (!cancelled) setLiveHistory({ id, days, data: [] })
      })

    return () => { cancelled = true }
  }, [days, id, isDemo])

  useEffect(() => {
    if (!id || isDemo) return
    const source = new EventSource(`${envConfig.API_URL}/telemetry/stream`)

    source.onmessage = (event: MessageEvent) => {
      const { containerId, fillLevel, batteryLevel } = JSON.parse(event.data as string)
      if (containerId !== id) return
      setLiveDetails(prev => ({
        ...prev,
        container: prev.container ? { ...prev.container, fillLevel, batteryLevel } : prev.container,
      }))
    }

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setLiveDetails(prev => ({ ...prev, error: 'Telemetry stream disconnected' }))
      }
    }

    return () => source.close()
  }, [id, isDemo])

  if (!id) {
    return { container: null, fillHistory: [], days, setDays, loading: false, error: 'Container not found' }
  }

  if (isDemo) {
    return {
      container: listedContainer ?? null,
      fillHistory: demoFillHistory,
      days,
      setDays,
      loading: containersLoading,
      error: listedContainer ? '' : 'Container not found',
    }
  }

  const liveContainer = liveDetails.id === id ? liveDetails.container : null
  const container = liveContainer ?? listedContainer ?? null
  const detailPending = !container && liveDetails.id !== id
  const fillHistory = liveHistory.id === id && liveHistory.days === days ? liveHistory.data : []
  const error = liveDetails.id === id ? liveDetails.error : ''

  return {
    container,
    fillHistory,
    days,
    setDays,
    loading: containersLoading || detailPending,
    error: error || (!container ? containersError : '') || '',
  }
}
