import { NavLink } from 'react-router-dom'
import { Layers, Cpu, Monitor, Globe, FileCode2, Atom } from '@icons'
import { ROUTES } from '@shared/constants/routes'

export function NavBar() {
  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface-raised overflow-x-auto shrink-0">
      <span className="font-mono font-semibold text-primary text-sm mr-3 tracking-tight shrink-0">
        JS Visualizer
      </span>

      <span className="text-border/60 text-xs mr-1 shrink-0">│</span>

      <div className="flex items-center gap-0.5">
        <GroupLabel>JS Runtime</GroupLabel>
        <NavItem to={ROUTES.TASK_QUEUE} icon={<Layers size={13} />} label="Event Loop" />
        <NavItem to={ROUTES.COMPILATION} icon={<Cpu size={13} />} label="Compilation" />
      </div>

      <span className="text-border/60 text-xs mx-1 shrink-0">│</span>

      <div className="flex items-center gap-0.5">
        <GroupLabel>Browser</GroupLabel>
        <NavItem to={ROUTES.RENDERING} icon={<Monitor size={13} />} label="Rendering" />
        <NavItem to={ROUTES.NETWORK} icon={<Globe size={13} />} label="Network" />
        <NavItem to={ROUTES.DOM_CSSOM} icon={<FileCode2 size={13} />} label="DOM/CSSOM" />
      </div>

      <span className="text-border/60 text-xs mx-1 shrink-0">│</span>

      <div className="flex items-center gap-0.5">
        <GroupLabel>React</GroupLabel>
        <NavItem to={ROUTES.REACT} icon={<Atom size={13} />} label="React" />
      </div>
    </nav>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-widest text-text-dim px-1.5 shrink-0">
      {children}
    </span>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
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
