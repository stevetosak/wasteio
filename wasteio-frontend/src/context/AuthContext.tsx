import { createContext, useContext, useState, type ReactNode } from 'react'
import { loginApi, registerApi } from '../lib/authApi'

export interface AuthUser {
  token: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (token: string, name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'auth'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  async function login(email: string, password: string) {
    const res = await loginApi(email, password)
    const authUser: AuthUser = { token: res.token, email: res.email, name: res.name, role: res.role }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    setUser(authUser)
  }

  async function register(token: string, name: string, email: string, password: string) {
    await registerApi(token, name, email, password)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
