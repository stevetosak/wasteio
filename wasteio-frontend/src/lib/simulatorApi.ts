import type { SimulatorConfig } from '../types/simulator'
import { getStoredToken } from './authApi'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function fetchSimulatorConfig(): Promise<SimulatorConfig> {
  return req('/simulator/config')
}

export async function updateSimulatorConfig(config: Partial<SimulatorConfig>): Promise<SimulatorConfig> {
  return req('/simulator/config', { method: 'PUT', body: JSON.stringify(config) })
}

export async function triggerPickup(containerId: string): Promise<void> {
  await req<void>(`/devices/${containerId}/pickup`, { method: 'POST' })
}
