import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import AppLayout from './components/layout/AppLayout'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage'
import RegisterPage from './pages/RegisterPage'
import SelectJurisdictionPage from './pages/SelectJurisdictionPage'
import MapOverviewPage from './pages/MapOverviewPage'
import ContainersPage from './pages/ContainersPage'
import ContainerDetailsPage from './pages/ContainerDetailsPage'
import PickupRoutesPage from './pages/PickupRoutesPage'
import ActivePickupPage from './pages/ActivePickupPage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import SimulatorPage from './pages/SimulatorPage'
import NotFoundPage from './pages/NotFoundPage'
import LearnMorePage from './pages/LearnMorePage'
import GuestRoute from './components/layout/GuestRoute'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Pre-auth (redirects to /map if already logged in) */}
      <Route element={<GuestRoute />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/learn-more" element={<LearnMorePage />} />
        <Route path="/jurisdiction" element={<SelectJurisdictionPage />} />
      </Route>

      {/* Protected dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/map" element={<MapOverviewPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/containers/:id" element={<ContainerDetailsPage />} />
          <Route path="/routes" element={<PickupRoutesPage />} />
          <Route path="/routes/active" element={<ActivePickupPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

          {/* Admin-only */}
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
            </Route>
          </Route>

      <Route path="*" element={<NotFoundPage />} />
    </>
  )
)

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
