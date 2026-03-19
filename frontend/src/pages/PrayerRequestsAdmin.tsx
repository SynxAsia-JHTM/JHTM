import React, { useEffect, useMemo } from 'react';
import { HeartHandshake } from 'lucide-react';

import { usePrayerRequestsStore } from '@/stores/prayerRequestsStore';

export default function PrayerRequestsAdmin() {
  const loadAdminRequests = usePrayerRequestsStore((s) => s.loadAdminRequests);
  const adminRequests = usePrayerRequestsStore((s) => s.adminRequests);

  useEffect(() => {
    void loadAdminRequests();
  }, [loadAdminRequests]);

  const summary = useMemo(() => {
    return {
      total: adminRequests.length,
      anonymous: adminRequests.filter((r) => r.isAnonymous).length,
      publicCount: adminRequests.filter((r) => r.visibility === 'public').length,
    };
  }, [adminRequests]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Prayer Requests</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              Oversight for all submissions.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <HeartHandshake size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{summary.total}</p>
        </div>
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Anonymous</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{summary.anonymous}</p>
        </div>
        <div className="jhtm-card p-5">
          <p className="text-sm font-semibold text-slate-500">Public</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{summary.publicCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">All Submissions</h2>
          <p className="mt-1 text-sm text-slate-500">Newest first. No approval required.</p>
        </div>

        {adminRequests.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No prayer requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Visibility
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Message
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminRequests.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        Submitted
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {r.isAnonymous ? 'Anonymous' : (r.userEmail ?? `User ${r.userId}`)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">ID: {r.userId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {r.visibility === 'private'
                          ? 'Private'
                          : r.visibility === 'leaders'
                            ? 'Leaders Only'
                            : 'Public'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{r.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
