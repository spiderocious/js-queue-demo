import { NavLink } from 'react-router-dom'
import { Layers, Cpu } from '@icons'
import { ROUTES } from '@shared/constants/routes'

export function NavBar() {
  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface-raised">
      <span className="font-mono font-semibold text-primary text-sm mr-4 tracking-tight">
        JS Visualizer
      </span>

      <NavItem to={ROUTES.TASK_QUEUE} icon={<Layers size={15} />} label="Event Loop" />
      <NavItem to={ROUTES.COMPILATION} icon={<Cpu size={15} />} label="Compilation" />
    </nav>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-text-muted hover:text-text hover:bg-surface-overlay'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
