import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { user, validating } = useAuth()
  if (validating) return null
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
