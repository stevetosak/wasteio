import type { SimDevice } from '../types/simDevice'
import type { SimulatorConfig } from '../types/simulator'
import { getStoredToken } from './authApi'
import { envConfig } from '../config/env'

const BASE = envConfig.API_URL.replace(/\/api$/, '')

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
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function fetchSimDevices(): Promise<SimDevice[]> {
  return req('/admin/devices/sim')
}

export async function pushDeviceConfig(deviceId: string, config: SimulatorConfig): Promise<void> {
  await req<void>(`/admin/devices/${deviceId}/config`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}
