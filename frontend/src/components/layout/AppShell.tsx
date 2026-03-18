import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Church,
  ClipboardCheck,
  Info,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  Users,
} from 'lucide-react';
import BackToHomeLink from '../navigation/BackToHomeLink';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Members', icon: Users, path: '/members' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
  { label: 'About', icon: Info, path: '/about' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <div className="rounded-lg bg-blue-600 p-2">
            <Church className="text-white" size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">JHTM Church</p>
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">Management System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <BackToHomeLink />
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-500"
                placeholder="Search members, events, ministries"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-900" type="button" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{user.email?.split('@')[0] || 'Admin'}</p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Administrator</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                <User size={20} />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:text-red-600"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
