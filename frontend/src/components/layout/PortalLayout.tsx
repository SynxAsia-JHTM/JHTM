import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Church, 
  LayoutDashboard, 
  User, 
  ClipboardCheck, 
  CalendarClock, 
  Heart,
  Calendar, 
  LogOut, 
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const portalNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/portal' },
  { label: 'Profile', icon: User, path: '/portal/profile' },
  { label: 'Check-in', icon: ClipboardCheck, path: '/portal/checkin' },
  { label: 'My Attendance', icon: CalendarClock, path: '/portal/attendance' },
  { label: 'Prayer Requests', icon: Heart, path: '/portal/prayers' },
  { label: 'Events', icon: Calendar, path: '/portal/events' },
];

type PortalLayoutProps = {
  children: React.ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2">
            <Church className="text-white" size={20} />
          </div>
          <span className="font-bold text-slate-900">JHTM Portal</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out',
            'fixed inset-y-0 left-0 z-40 hidden lg:static lg:z-auto lg:block',
            collapsed ? 'w-16' : 'w-72 sm:w-80 lg:w-64'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo Section */}
            <div
              className={cn(
                'flex items-center gap-3 border-b border-slate-100 p-4',
                collapsed && 'justify-center px-2'
              )}
            >
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                  collapsed && 'lg:hidden'
                )}
              >
                <Menu size={20} />
              </button>

              <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'hidden')}>
                <div className="rounded-lg bg-blue-600 p-2">
                  <Church className="text-white" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-900">JHTM</p>
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Member Portal
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className={cn('flex-1 space-y-1 p-3', collapsed && 'px-2')}>
              {portalNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/portal'}
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
                  <item.icon size={20} />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Logout Button */}
            <div className={cn('border-t border-slate-100 p-3', collapsed && 'px-2')}>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2',
                  collapsed && 'justify-center px-0'
                )}
              >
                <LogOut size={20} />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>Logout</span>
              </button>
            </div>

            {/* Footer */}
            <div
              className={cn(
                'border-t border-slate-100 p-3 text-xs font-semibold text-slate-400',
                collapsed && 'px-2 text-center'
              )}
            >
              <span className={cn(collapsed && 'lg:hidden')}>JHTM Church</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
