import type {Container, ContainerFormData, ContainerStatus, WasteType} from '../types/container'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

interface ApiContainer {
  id: string
  name: string
  address: string
  wasteType: string
  capacityLiters: number
  fillLevel: number
  batteryLevel: number
  status: string
  lastPickup: string | null
  location: { lat: number; lng: number }
}

const toApiWasteType: Record<WasteType, string> = {
  general: 'GENERAL',
  recycling: 'RECYCLABLE',
  organic: 'ORGANIC',
  hazardous: 'HAZARDOUS',
}

const fromApiWasteType: Record<string, WasteType> = {
  GENERAL: 'general',
  RECYCLABLE: 'recycling',
  ORGANIC: 'organic',
  HAZARDOUS: 'hazardous',
  GLASS: 'recycling',
  PAPER: 'recycling',
  PLASTIC: 'recycling',
  ELECTRONIC: 'hazardous',
}

const fromApiStatus: Record<string, ContainerStatus> = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
}


function fromApi(raw: ApiContainer): Container {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    wasteType: fromApiWasteType[raw.wasteType] ?? 'general',
    status: fromApiStatus[raw.status] ?? 'active',
    capacityLiters: raw.capacityLiters,
    fillLevel: raw.fillLevel,
    batteryLevel: raw.batteryLevel,
    lastPickup: raw.lastPickup ?? '',
    location: raw.location,
  }
}

function toApi(data: ContainerFormData) {
  return {
    name: data.name,
    address: data.address,
    wasteType: toApiWasteType[data?.wasteType ?? 'general'],
    capacityLiters: data.capacityLiters,
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function fetchContainers(): Promise<Container[]> {
  const raw = await req<ApiContainer[]>('/devices')
  return raw.map(fromApi)
}

export async function createContainerApi(data: ContainerFormData): Promise<Container> {
  const raw = await req<ApiContainer>('/devices', {
    method: 'POST',
    body: JSON.stringify(toApi(data)),
  })
  return fromApi(raw)
}

export async function updateContainerApi(id: string, data: ContainerFormData): Promise<Container> {
  const raw = await req<ApiContainer>(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...toApi(data) }),
  })
  return fromApi(raw)
}

export async function deleteContainerApi(id: string): Promise<void> {
  await req<void>(`/devices/${id}`, { method: 'DELETE' })
}
