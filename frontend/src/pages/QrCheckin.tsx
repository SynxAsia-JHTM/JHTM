import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, QrCode, UserPlus2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@/lib/apiClient';
import { useAttendanceStore } from '@/stores/attendanceStore';

function computeStatus(date: string, time: string): 'present' | 'late' {
  const safeTime = time?.length ? time : '00:00';
  const iso = `${date}T${safeTime}`;
  const start = new Date(iso);
  if (!Number.isFinite(start.getTime())) return 'present';
  const lateAfterMs = 10 * 60_000;
  return Date.now() > start.getTime() + lateAfterMs ? 'late' : 'present';
}

export default function QrCheckin() {
  const toast = useToast();
  const navigate = useNavigate();
  const { token } = useParams();

  const fetchToken = useAttendanceStore((s) => s.fetchToken);
  const selfAttend = useAttendanceStore((s) => s.selfAttend);
  const submitQrGuest = useAttendanceStore((s) => s.submitQrGuest);

  const [tokenInfo, setTokenInfo] = useState<Awaited<ReturnType<typeof fetchToken>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const isSignedIn = useMemo(() => Boolean(getAuthToken()), []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!token) {
        if (alive) {
          setTokenInfo(null);
          setIsLoading(false);
        }
        return;
      }

      const info = await fetchToken(token);
      if (!alive) return;
      setTokenInfo(info);
      setIsLoading(false);
    };
    void run();
    return () => {
      alive = false;
    };
  }, [fetchToken, token]);

  const event = tokenInfo?.event ?? null;

  const onMemberScan = async () => {
    if (!event) return;
    setIsSubmitting(true);
    const status = computeStatus(event.date, event.time);
    const ok = await selfAttend({ eventId: event.id, status });
    setIsSubmitting(false);
    if (!ok) {
      toast.error('Unable to record', 'Please try again.');
      return;
    }
    toast.success('Recorded', 'Thank you for attending.');
    window.setTimeout(() => navigate('/portal'), 700);
  };

  const onGuestScan = async () => {
    if (!token || !guestName.trim()) return;
    setIsSubmitting(true);
    const ok = await submitQrGuest({
      tokenId: token,
      guestFullName: guestName.trim(),
      guestPhone: guestPhone.trim() || undefined,
      guestEmail: guestEmail.trim() || undefined,
    });
    setIsSubmitting(false);
    if (!ok) {
      toast.error('Unable to record', 'Please try again.');
      return;
    }
    toast.success('Recorded', 'Welcome!');
    window.setTimeout(() => navigate('/'), 700);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream p-6 text-center text-sm text-slate-600">Loading…</div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="jhtm-card mx-auto w-full max-w-lg p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky p-2">
              <QrCode className="text-navy" size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">Invalid attendance link</p>
              <p className="mt-1 text-sm text-slate-600">Ask an admin to generate a new link.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Attendance</p>
          <h1 className="mt-2 text-2xl font-extrabold">{event?.name ?? 'Service'}</h1>
          <p className="mt-2 text-sm text-white/85">
            {event ? `${event.date} · ${event.time} · ${event.location}` : ''}
          </p>
        </div>

        {isSignedIn ? (
          <div className="jhtm-card p-5">
            <p className="text-sm text-slate-600">
              Tap below to record your attendance. If you previously marked “Expected / Early”, it
              will be updated.
            </p>
            <button
              type="button"
              onClick={onMemberScan}
              disabled={!event || isSubmitting}
              className={cn(
                'jhtm-btn jhtm-btn-primary mt-4 h-11 w-full',
                isSubmitting && 'animate-pulse'
              )}
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              {isSubmitting ? 'Recording…' : "I'm Here 🙏"}
            </button>
          </div>
        ) : (
          <div className="jhtm-card p-5">
            <div className="flex items-center gap-2">
              <UserPlus2 size={18} className="text-slate-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">Guest attendance</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">Enter your name to record attendance.</p>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                    placeholder="Phone"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email (optional)
                  </label>
                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                    placeholder="Email"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onGuestScan}
                disabled={!guestName.trim() || isSubmitting}
                className={cn(
                  'jhtm-btn jhtm-btn-primary h-11 w-full',
                  isSubmitting && 'animate-pulse'
                )}
              >
                <CheckCircle2 size={18} aria-hidden="true" />
                {isSubmitting ? 'Recording…' : 'Record attendance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
