import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import WelcomePage from './pages/WelcomePage'
import SignInPage from './pages/SignInPage'
import SelectJurisdictionPage from './pages/SelectJurisdictionPage'
import MapOverviewPage from './pages/MapOverviewPage'
import ContainerDetailsPage from './pages/ContainerDetailsPage'
import PickupRoutesPage from './pages/PickupRoutesPage'
import ActivePickupPage from './pages/ActivePickupPage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pre-auth */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/jurisdiction" element={<SelectJurisdictionPage />} />

        {/* Dashboard */}
        <Route element={<AppLayout />}>
          <Route path="/map" element={<MapOverviewPage />} />
          <Route path="/containers/:id" element={<ContainerDetailsPage />} />
          <Route path="/containers" element={<ContainerDetailsPage />} />
          <Route path="/routes" element={<PickupRoutesPage />} />
          <Route path="/routes/active" element={<ActivePickupPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />      
      </Routes>
    </BrowserRouter>
  )
}
