import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loginApi, registerApi, getMeApi } from '../lib/authApi'

export interface AuthUser {
  token: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  validating: boolean
  login: (email: string, password: string) => Promise<void>
  register: (token: string, name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'auth'

function loadToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [validating, setValidating] = useState<boolean>(() => loadToken() !== null)

  useEffect(() => {
    const token = loadToken()
    if (!token) return
    getMeApi(token)
      .then(me => setUser({ token, email: me.email, name: me.name, role: me.role }))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      })
      .finally(() => setValidating(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await loginApi(email, password)
    localStorage.setItem(STORAGE_KEY, res.token)
    setUser({ token: res.token, email: res.email, name: res.name, role: res.role })
  }

  async function register(token: string, name: string, email: string, password: string) {
    await registerApi(token, name, email, password)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, validating, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
