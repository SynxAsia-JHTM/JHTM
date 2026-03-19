import React from 'react';
import { ExternalLink, Palette, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
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
            <h1 className="text-2xl font-extrabold">Settings</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              Customize your admin experience.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <Settings2 size={22} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-2 text-sky-800">
              <Palette size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Theme</p>
              <p className="mt-1 text-sm text-slate-600">
                Using the JHTM palette across all modules.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="h-12 rounded-xl" style={{ backgroundColor: '#355872' }} />
            <div className="h-12 rounded-xl" style={{ backgroundColor: '#7AAACE' }} />
            <div className="h-12 rounded-xl" style={{ backgroundColor: '#9CD5FF' }} />
            <div
              className="h-12 rounded-xl border border-slate-200"
              style={{ backgroundColor: '#F7F8F0' }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Help</p>
          <p className="mt-1 text-sm text-slate-600">About and documentation links.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/about"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              About
            </Link>
            <a
              href="https://example.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-600"
            >
              Docs
              <ExternalLink size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
