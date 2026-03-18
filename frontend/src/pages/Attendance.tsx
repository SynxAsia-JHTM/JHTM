import React from 'react';

const attendance = [
  { id: 1, service: 'Sunday Worship', date: 'Mar 15, 2026', total: 412, firstTimers: 9 },
  { id: 2, service: 'Sunday Worship', date: 'Mar 08, 2026', total: 398, firstTimers: 7 },
  { id: 3, service: 'Prayer Meeting', date: 'Mar 11, 2026', total: 96, firstTimers: 3 },
  { id: 4, service: 'Youth Service', date: 'Mar 13, 2026', total: 142, firstTimers: 6 },
];

export default function Attendance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-slate-500">Monitor attendance trends across services.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Average Sunday Attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">405</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">First-time Visitors (30 days)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">28</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Small Groups Attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">192</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Services</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Service</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">First Timers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{a.service}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{a.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{a.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{a.firstTimers}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

