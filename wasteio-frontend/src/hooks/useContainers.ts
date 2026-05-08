import { useState, useEffect } from 'react'
import type { Container, ContainerFormData } from '../types/container'
import {
  fetchContainers,
  createContainerApi,
  updateContainerApi,
  deleteContainerApi,
} from '../lib/containerApi'

const INITIAL_CONTAINERS: Container[] = [
  {
    id: 'C-1042',
    name: 'Container C-1042',
    address: 'Blvd. Partizanski Odredi 14, Centar',
    wasteType: 'recycling',
    capacityLiters: 1100,
    fillLevel: 75,
    batteryLevel: 82,
    status: 'active',
    lastPickup: '2026-05-06T14:30:00Z',
    location: { lat: 41.9981, lng: 21.4254 },
  },
  {
    id: 'C-0831',
    name: 'Container C-0831',
    address: 'Ul. Makedonija 12, Centar',
    wasteType: 'general',
    capacityLiters: 660,
    fillLevel: 92,
    batteryLevel: 45,
    status: 'active',
    lastPickup: '2026-05-05T08:00:00Z',
    location: { lat: 41.9964, lng: 21.4314 },
  },
  {
    id: 'C-0557',
    name: 'Container C-0557',
    address: 'Bul. Jane Sandanski 72, Gazi Baba',
    wasteType: 'organic',
    capacityLiters: 240,
    fillLevel: 33,
    batteryLevel: 91,
    status: 'active',
    lastPickup: '2026-05-06T10:15:00Z',
    location: { lat: 42.0051, lng: 21.4621 },
  },
  {
    id: 'C-0229',
    name: 'Container C-0229',
    address: 'Ul. Zeleznicka 3, Aerodrom',
    wasteType: 'hazardous',
    capacityLiters: 120,
    fillLevel: 58,
    batteryLevel: 67,
    status: 'maintenance',
    lastPickup: '2026-05-04T16:45:00Z',
    location: { lat: 41.9836, lng: 21.4431 },
  },
  {
    id: 'C-0711',
    name: 'Container C-0711',
    address: 'Bul. Aleksandar Makedonski 99, Kisela Voda',
    wasteType: 'general',
    capacityLiters: 1100,
    fillLevel: 85,
    batteryLevel: 23,
    status: 'active',
    lastPickup: '2026-05-05T12:00:00Z',
    location: { lat: 41.9765, lng: 21.4501 },
  },
  {
    id: 'C-0394',
    name: 'Container C-0394',
    address: 'Ul. 11 Oktomvri 43, Butel',
    wasteType: 'recycling',
    capacityLiters: 660,
    fillLevel: 12,
    batteryLevel: 99,
    status: 'active',
    lastPickup: '2026-05-07T07:00:00Z',
    location: { lat: 42.0221, lng: 21.4288 },
  },
  {
    id: 'C-0106',
    name: 'Container C-0106',
    address: 'Bul. Partizanski Odredi 57, Saraj',
    wasteType: 'general',
    capacityLiters: 1100,
    fillLevel: 0,
    batteryLevel: 0,
    status: 'offline',
    lastPickup: '2026-05-01T09:30:00Z',
    location: { lat: 42.0098, lng: 21.3812 },
  },
  {
    id: 'C-0889',
    name: 'Container C-0889',
    address: 'Ul. Vasil Gjorgov 21, Karpos',
    wasteType: 'organic',
    capacityLiters: 240,
    fillLevel: 61,
    batteryLevel: 74,
    status: 'active',
    lastPickup: '2026-05-06T11:00:00Z',
    location: { lat: 41.9997, lng: 21.4129 },
  },
]

const DEMO_KEY = 'wasteio-demo-mode'
const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

export function useContainers() {
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem(DEMO_KEY) !== 'false')

  // Demo containers are independent local state seeded with mock data.
  // Live containers are populated from the API and reset on each toggle to live.
  const [demoContainers, setDemoContainers] = useState<Container[]>(INITIAL_CONTAINERS)
  const [liveContainers, setLiveContainers] = useState<Container[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containers = isDemo ? demoContainers : liveContainers

  // Fetch from API whenever switching to live mode
  useEffect(() => {
    if (isDemo) return
    let cancelled = false

    async function doFetch() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchContainers()
        if (!cancelled) setLiveContainers(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load containers')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void doFetch()
    return () => { cancelled = true }
  }, [isDemo])

  function toggleDemo() {
    setIsDemo(prev => {
      const next = !prev
      localStorage.setItem(DEMO_KEY, String(next))
      return next
    })
  }

  async function createContainer(data: ContainerFormData): Promise<void> {
    if (isDemo) {
      setLoading(true)
      await delay(400)
      setDemoContainers(prev => [...prev, {
        ...data,
        id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
        fillLevel: 0,
        batteryLevel: 100,
        lastPickup: new Date().toISOString(),
      }])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const created = await createContainerApi(data)
      setLiveContainers(prev => [...prev, created])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create container')
    } finally {
      setLoading(false)
    }
  }

  async function updateContainer(id: string, data: ContainerFormData): Promise<void> {
    if (isDemo) {
      setLoading(true)
      await delay(400)
      setDemoContainers(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updated = await updateContainerApi(id, data)
      setLiveContainers(prev => prev.map(c => (c.id === id ? updated : c)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update container')
    } finally {
      setLoading(false)
    }
  }

  async function deleteContainer(id: string): Promise<void> {
    if (isDemo) {
      setLoading(true)
      await delay(400)
      setDemoContainers(prev => prev.filter(c => c.id !== id))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await deleteContainerApi(id)
      setLiveContainers(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete container')
    } finally {
      setLoading(false)
    }
  }

  return { containers, loading, error, isDemo, toggleDemo, createContainer, updateContainer, deleteContainer }
}
