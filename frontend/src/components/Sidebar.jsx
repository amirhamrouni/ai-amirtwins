import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  SparklesIcon,
  CalendarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const links = [
  { to: '/', label: 'الرئيسية', icon: HomeIcon },
  { to: '/generator', label: 'صانع المحتوى', icon: SparklesIcon },
  { to: '/calendar', label: 'التقويم', icon: CalendarIcon },
  { to: '/settings', label: 'الإعدادات', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-surface border-l border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-accent">🤖 AI Agent</h1>
        <p className="text-xs text-muted mt-1">Facebook Auto-Publisher</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-muted hover:bg-border hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
