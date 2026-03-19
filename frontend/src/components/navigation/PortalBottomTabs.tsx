import React from 'react';
import { Calendar, ClipboardCheck, Heart, Home, type LucideIcon, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TabItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
};

const tabs: TabItem[] = [
  { label: 'Home', path: '/portal', icon: Home, end: true },
  { label: 'Events', path: '/portal/events', icon: Calendar },
  { label: 'Attendance', path: '/portal/attendance', icon: ClipboardCheck },
  { label: 'Prayer', path: '/portal/prayers', icon: Heart },
  { label: 'Profile', path: '/portal/profile', icon: UserRound },
];

export default function PortalBottomTabs() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      aria-label="Member portal"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-semibold transition',
                isActive ? 'text-navy' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <React.Fragment>
                <t.icon
                  size={20}
                  className={cn(isActive ? 'text-navy' : 'text-slate-500')}
                  aria-hidden="true"
                />
                <span className="leading-none">{t.label}</span>
              </React.Fragment>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
