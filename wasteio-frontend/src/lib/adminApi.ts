import { getStoredToken } from './authApi'
import { envConfig } from '../config/env'

const BASE = envConfig.API_URL.replace(/\/api$/, '')

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
}

export interface AdminToken {
  id: number
  token: string
  used: boolean
  createdBy: string | null
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function generateInviteToken(): Promise<string> {
  const token = getStoredToken()
  const res = await fetch(`${BASE}/admin/generate-token`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(await res.text())
  return res.text()
}

export async function fetchUsers(): Promise<AdminUser[]> {
  return req<AdminUser[]>('/admin/users')
}

export async function deleteUser(id: number): Promise<void> {
  return req<void>(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function fetchTokens(): Promise<AdminToken[]> {
  return req<AdminToken[]>('/admin/tokens')
}
