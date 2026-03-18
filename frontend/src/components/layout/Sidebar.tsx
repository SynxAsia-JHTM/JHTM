import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Church, ClipboardCheck, Info, LayoutDashboard, Menu, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Members', icon: Users, path: '/members' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
  { label: 'About', icon: Info, path: '/about' },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  toggleButtonRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
};

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  toggleButtonRef,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out',
        'fixed inset-y-0 left-0 z-40 lg:static lg:z-auto',
        collapsed ? 'w-16' : 'w-72 sm:w-80 lg:w-64',
        className
      )}
      aria-label="Primary"
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex items-center gap-3 border-b border-slate-100 p-4',
            collapsed && 'justify-center px-2'
          )}
        >
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'hidden')}>
            <div className="rounded-lg bg-blue-600 p-2">
              <Church className="text-white" size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-900">JHTM Church</p>
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
                Management System
              </p>
            </div>
          </div>
        </div>

        <nav className={cn('flex-1 space-y-1 p-3', collapsed && 'px-2')}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon size={20} aria-hidden="true" />
              <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className={cn(
            'border-t border-slate-100 p-3 text-xs font-semibold text-slate-400',
            collapsed && 'px-2 text-center'
          )}
        >
          <span className={cn(collapsed && 'sr-only')}>JHTM</span>
          <span aria-hidden="true" className={cn(!collapsed && 'hidden')}>
            •
          </span>
        </div>
      </div>
    </aside>
  );
}
