import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';
import { useToast } from '@/components/ui/useToast';

const palette = {
  primary: '#355872',
  secondary: '#7AAACE',
  highlight: '#9CD5FF',
  background: '#F7F8F0',
};

export default function ResetPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen p-4" style={{ background: palette.background }}>
      <BackToHomeLink variant="floating" />
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div
          className="px-8 pb-6 pt-8"
          style={{
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 55%, ${palette.background} 100%)`,
          }}
        >
          <h1 className="text-center text-2xl font-extrabold text-white">Reset password</h1>
          <p className="mt-1 text-center text-sm font-semibold text-white/85">
            Enter your email to receive reset instructions.
          </p>
        </div>

        <form
          className="space-y-5 p-8"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setIsSubmitting(true);
            await new Promise((r) => setTimeout(r, 600));
            setIsSubmitting(false);
            toast.success(
              'Request submitted',
              'If your account exists, you will receive an email shortly.'
            );
            setEmail('');
          }}
        >
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={18} aria-hidden="true" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-sky-200 focus:bg-white focus:ring-2 focus:ring-sky-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: palette.primary }}
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm font-semibold text-slate-600">
            You can also contact your church admin for help.
          </p>
        </form>
      </div>
    </div>
  );
}
