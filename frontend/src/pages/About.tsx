import React from 'react';

export default function About() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">About</h1>
        <p className="mt-1 text-slate-500">JHTM Church Management System frontend.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Environment Configuration</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">API Base URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">{import.meta.env.VITE_API_URL || ''}</p>
            <p className="mt-2 text-sm text-slate-600">
              Set <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-semibold">VITE_API_URL</code> in Vercel to connect to your backend API.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Supabase</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">
              {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : ''}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Optional: <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-semibold">VITE_SUPABASE_URL</code> and{' '}
              <code className="rounded bg-slate-200 px-1 py-0.5 text-xs font-semibold">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
