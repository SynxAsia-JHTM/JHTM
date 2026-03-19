import React, { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, LockKeyhole, type LucideIcon, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';
import { useToast } from '@/components/ui/useToast';

const palette = {
  primary: '#355872',
  secondary: '#7AAACE',
  highlight: '#9CD5FF',
  background: '#F7F8F0',
};

type StepKey = 'profile' | 'notifications' | 'privacy';

export default function Onboarding() {
  const toast = useToast();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem('token') || sessionStorage.getItem('token'), []);
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}') as {
        email?: string;
        role?: string;
      };
    } catch {
      return {} as { email?: string; role?: string };
    }
  }, []);

  const [step, setStep] = useState<StepKey>('profile');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [shareProfile, setShareProfile] = useState(true);
  const [sharePrayerRequests, setSharePrayerRequests] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const steps: Array<{ key: StepKey; label: string; icon: LucideIcon }> = [
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'notifications', label: 'Notifications', icon: BellRing },
    { key: 'privacy', label: 'Privacy', icon: LockKeyhole },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  const goNext = () => {
    const next = steps[currentIndex + 1]?.key;
    if (!next) return;
    setStep(next);
  };

  const complete = () => {
    localStorage.setItem('jhtm.onboardingComplete.v1', 'true');
    localStorage.setItem(
      'jhtm.onboarding.profile.v1',
      JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() })
    );
    localStorage.setItem(
      'jhtm.onboarding.privacy.v1',
      JSON.stringify({ shareProfile, sharePrayerRequests, allowNotifications })
    );
    toast.success('All set', 'Your preferences have been saved.');
    navigate('/portal');
  };

  return (
    <div className="min-h-screen p-4" style={{ background: palette.background }}>
      <BackToHomeLink variant="floating" />
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div
          className="px-8 pb-6 pt-8"
          style={{
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 55%, ${palette.background} 100%)`,
          }}
        >
          <p className="text-center text-xs font-bold uppercase tracking-wider text-white/80">
            Onboarding
          </p>
          <h1 className="mt-2 text-center text-2xl font-extrabold text-white">
            Welcome, {user.email ?? 'Member'}
          </h1>
          <p className="mt-1 text-center text-sm font-semibold text-white/85">
            Complete these steps to personalize your portal.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {steps.map((s, idx) => {
              const active = s.key === step;
              const done = idx < currentIndex;
              return (
                <div
                  key={s.key}
                  className={
                    'rounded-2xl px-3 py-3 text-center ring-1 ring-white/20 ' +
                    (active ? 'bg-white/15' : done ? 'bg-white/10' : 'bg-white/5')
                  }
                >
                  <div className="mx-auto flex w-fit items-center gap-2">
                    <s.icon size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-white/75">
                    {active ? 'In progress' : done ? 'Completed' : 'Pending'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {step === 'profile' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Complete your profile</p>
                <p className="mt-1 text-sm text-slate-600">
                  This helps your church keep records accurate.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-600"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-600"
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/portal')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: palette.primary }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 'notifications' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="mt-1 text-sm text-slate-600">Get reminders for events and updates.</p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={allowNotifications}
                  onChange={(e) => setAllowNotifications(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-navy focus:ring-sky-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Enable notifications</p>
                  <p className="mt-1 text-sm text-slate-600">
                    You can change this later in Profile.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: palette.primary }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 'privacy' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Privacy</p>
                <p className="mt-1 text-sm text-slate-600">
                  Control how your information is shared.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={shareProfile}
                  onChange={(e) => setShareProfile(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-navy focus:ring-sky-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Share profile with church staff
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Allows admins to contact you when needed.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={sharePrayerRequests}
                  onChange={(e) => setSharePrayerRequests(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-navy focus:ring-sky-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Allow leaders to view my prayer requests
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Your requests remain private unless approved.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStep('notifications')}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={complete}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: palette.primary }}
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Finish
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
