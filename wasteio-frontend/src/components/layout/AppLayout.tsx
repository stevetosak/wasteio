import { Outlet, useNavigation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const navigation = useNavigation()
  const navigating = navigation.state !== 'idle'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-800">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {navigating && (
          <div className="absolute top-0 inset-x-0 z-50 h-[2px] overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ animation: 'nav-bar 1s ease-in-out infinite' }}
            />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
