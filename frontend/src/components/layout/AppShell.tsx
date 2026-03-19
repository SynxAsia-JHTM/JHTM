import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search, User } from 'lucide-react';
import BackToHomeLink from '../navigation/BackToHomeLink';
import Sidebar from './Sidebar';

export default function AppShell() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const sidebarToggleButtonRef = useRef<HTMLButtonElement | null>(null);

  const sidebarStorageKey = 'jhtm.sidebarCollapsed.v1';
  const hasPreferenceRef = useRef(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(sidebarStorageKey);
      if (raw === 'true') {
        hasPreferenceRef.current = true;
        return true;
      }
      if (raw === 'false') {
        hasPreferenceRef.current = true;
        return false;
      }
    } catch {
      return true;
    }

    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (hasPreferenceRef.current) return;
    const media = window.matchMedia('(min-width: 1024px)');
    const handler = () => setSidebarCollapsed(!media.matches);
    handler();

    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const setCollapsed = (next: boolean) => {
    setSidebarCollapsed(next);
    hasPreferenceRef.current = true;
    try {
      localStorage.setItem(sidebarStorageKey, String(next));
    } catch {
      return;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="relative flex min-h-screen bg-cream">
      {!sidebarCollapsed ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => {
            setCollapsed(true);
            window.setTimeout(() => sidebarToggleButtonRef.current?.focus(), 0);
          }}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setCollapsed(!sidebarCollapsed)}
        toggleButtonRef={sidebarToggleButtonRef}
        onSignOut={handleLogout}
        onNavigate={() => {
          if (typeof window === 'undefined') return;
          if (window.matchMedia('(min-width: 1024px)').matches) return;
          setCollapsed(true);
          window.setTimeout(() => sidebarToggleButtonRef.current?.focus(), 0);
        }}
      />

      <div
        className={
          sidebarCollapsed
            ? 'flex min-w-0 flex-1 flex-col pl-16 lg:pl-16'
            : 'flex min-w-0 flex-1 flex-col pl-16 lg:pl-72'
        }
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <BackToHomeLink />
            <div className="relative hidden w-full max-w-md md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                className="w-full rounded-full border border-transparent bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                placeholder="Search members, events, ministries"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative text-slate-500 hover:text-slate-900"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Administrator
                </p>
              </div>
              <div className="rounded-full bg-sky-100 p-2 text-navy">
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
