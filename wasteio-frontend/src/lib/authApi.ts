import { envConfig } from '../config/env'

const AUTH_BASE = envConfig.API_URL.replace(/\/api$/, '')

export interface LoginResponse {
  token: string
  email: string
  name: string
  role: string
}

export interface UserResponse {
  id: number
  name: string
  email: string
  role: string
}

async function authPost<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return authPost<LoginResponse>('/auth/login', { email, password })
}

export async function registerApi(
  token: string,
  name: string,
  email: string,
  password: string,
): Promise<UserResponse> {
  return authPost<UserResponse>('/auth/register', { token, name, email, password })
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('auth')
    return raw ? (JSON.parse(raw) as { token: string }).token : null
  } catch {
    return null
  }
}
