import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { NavBar } from '@shared/ui/nav-bar'

export function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <NavBar />
      <main className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-text-muted text-sm">
              Loading...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
