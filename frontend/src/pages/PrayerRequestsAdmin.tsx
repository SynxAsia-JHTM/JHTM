import React from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';

export default function PrayerRequestsAdmin() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #355872 0%, #7AAACE 55%, #F7F8F0 100%)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Prayer Requests</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              Review, approve, and manage member prayer requests.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <HeartHandshake size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
            <ShieldAlert size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Module UI ready</p>
            <p className="mt-1 text-sm text-slate-600">
              This page is wired into navigation without changing any existing routes.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Next step is connecting it to a prayer request data source (API/Supabase) and adding
              moderation actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
