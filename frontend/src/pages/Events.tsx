import React from 'react';

const events = [
  { id: 1, name: 'Sunday Worship Service', date: 'Mar 22, 2026', location: 'Main Sanctuary', status: 'Scheduled' },
  { id: 2, name: 'Mid-week Prayer Meeting', date: 'Mar 25, 2026', location: 'Chapel', status: 'Scheduled' },
  { id: 3, name: 'Youth Outreach Night', date: 'Mar 27, 2026', location: 'Community Hall', status: 'Scheduled' },
  { id: 4, name: 'Leadership Training', date: 'Apr 02, 2026', location: 'Conference Room', status: 'Planned' },
  { id: 5, name: 'Choir Rehearsal', date: 'Apr 04, 2026', location: 'Music Room', status: 'Scheduled' },
];

export default function Events() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <p className="mt-1 text-slate-500">Track and manage upcoming church events.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">Events List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Event</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{e.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{e.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{e.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                        (e.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700')
                      }
                    >
                      {e.status}
                    </span>
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

