import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';
import { useToast } from '@/components/ui/useToast';

export default function ResetPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-cream p-4">
      <BackToHomeLink variant="floating" />
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <Link
          to="/login"
          aria-label="Back to login"
          title="Back to login"
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <div className="bg-gradient-to-br from-navy via-sea to-cream px-8 pb-6 pt-8">
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
                className="jhtm-input h-11 pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="jhtm-btn jhtm-btn-primary h-11 w-full shadow-md"
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
