import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function GuestRoute() {
  const { user, validating } = useAuth()
  if (validating) return null
  return user ? <Navigate to="/map" replace /> : <Outlet />
}
