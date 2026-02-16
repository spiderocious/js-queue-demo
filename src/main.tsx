import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from '@app/App'
import { routes } from '@app/app.routes'
import './index.css'

const router = createBrowserRouter([
  {
    Component: App,
    children: routes,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
