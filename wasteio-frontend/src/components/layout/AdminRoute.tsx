import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute() {
  const { user, validating } = useAuth()
  if (validating) return null
  if (!user) return <Navigate to="/signin" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/map" replace />
  return <Outlet />
}
