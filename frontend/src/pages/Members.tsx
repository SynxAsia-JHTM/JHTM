import React from 'react';

const members = [
  { id: 1, name: 'John Smith', ministry: 'Worship', status: 'Active', phone: '+1 (555) 010-1200' },
  { id: 2, name: 'Sarah Wilson', ministry: 'Youth', status: 'Pending', phone: '+1 (555) 010-7741' },
  { id: 3, name: 'Michael Brown', ministry: 'Media', status: 'Active', phone: '+1 (555) 010-3344' },
  { id: 4, name: 'Emily Davis', ministry: 'Children', status: 'Active', phone: '+1 (555) 010-9021' },
  { id: 5, name: 'David Johnson', ministry: 'Ushering', status: 'Active', phone: '+1 (555) 010-4811' },
  { id: 6, name: 'Grace Thompson', ministry: 'Hospitality', status: 'Active', phone: '+1 (555) 010-6672' },
];

export default function Members() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Members</h1>
        <p className="mt-1 text-slate-500">View and manage member records.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">All Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ministry</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{m.ministry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{m.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                        (m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')
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
    </div>
  );
}

