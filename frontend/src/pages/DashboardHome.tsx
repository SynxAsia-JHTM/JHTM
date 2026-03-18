import React from 'react';
import { Calendar, Church, Users } from 'lucide-react';

const stats = [
  { label: 'Total Members', value: '1,248', icon: Users, color: 'text-blue-700', bg: 'bg-blue-50' },
  {
    label: 'Active Ministries',
    value: '18',
    icon: Church,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Upcoming Events',
    value: '5',
    icon: Calendar,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
  },
];

const recentMembers = [
  { id: 1, name: 'John Smith', ministry: 'Worship', status: 'Active' },
  { id: 2, name: 'Sarah Wilson', ministry: 'Youth', status: 'Pending' },
  { id: 3, name: 'Michael Brown', ministry: 'Media', status: 'Active' },
  { id: 4, name: 'Emily Davis', ministry: 'Children', status: 'Active' },
  { id: 5, name: 'David Johnson', ministry: 'Ushering', status: 'Active' },
];

const upcomingEvents = [
  {
    id: 1,
    name: 'Sunday Worship Service',
    date: 'Mar 22, 2026 • 10:00 AM',
    location: 'Main Sanctuary',
  },
  { id: 2, name: 'Mid-week Prayer Meeting', date: 'Mar 25, 2026 • 7:30 PM', location: 'Chapel' },
  {
    id: 3,
    name: 'Youth Outreach Night',
    date: 'Mar 27, 2026 • 6:00 PM',
    location: 'Community Hall',
  },
];

export default function DashboardHome() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Welcome back, {user.email?.split('@')[0] || 'Admin'}.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`${item.bg} rounded-xl p-2.5`}>
                <item.icon className={item.color} size={22} />
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ministry
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMembers.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{m.ministry}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                          (m.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700')
                        }
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
          </div>
          <div className="space-y-5 p-6">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <p className="text-sm font-bold text-slate-900">{e.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{e.date}</p>
                <p className="mt-2 text-xs text-slate-600">{e.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
