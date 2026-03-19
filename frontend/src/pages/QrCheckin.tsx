import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, QrCode, UserPlus2, Users2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { loadMembers } from '@/lib/memberData';
import {
  createAttendanceId,
  type AttendanceStatus,
  useAttendanceStore,
} from '@/stores/attendanceStore';
import { useEventsStore } from '@/stores/eventsStore';

function getAuthUser(): { email?: string; role?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as { email?: string; role?: string };
  } catch {
    return null;
  }
}

function computeStatus(startAtIso: string | null): AttendanceStatus {
  if (!startAtIso) return 'present';
  const now = Date.now();
  const start = Date.parse(startAtIso);
  if (!Number.isFinite(start)) return 'present';
  const lateAfterMs = 10 * 60_000;
  return now > start + lateAfterMs ? 'late' : 'present';
}

function toStartAtIso(date: string, time: string) {
  const safeTime = time?.length ? time : '00:00';
  const iso = `${date}T${safeTime}`;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function createGuestName() {
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `Guest ${suffix}`;
}

export default function QrCheckin() {
  const toast = useToast();
  const navigate = useNavigate();
  const { token } = useParams();
  const events = useEventsStore((s) => s.events);
  const tokens = useAttendanceStore((s) => s.tokens);
  const markTokenUsed = useAttendanceStore((s) => s.markTokenUsed);
  const upsertRecord = useAttendanceStore((s) => s.upsertRecord);
  const updateRecord = useAttendanceStore((s) => s.updateRecord);
  const records = useAttendanceStore((s) => s.records);

  const members = useMemo(() => loadMembers(), []);
  const memberOptions = useMemo(() => members.map((m) => ({ id: m.id, name: m.name })), [members]);
  const memberByName = useMemo(
    () => new Map(memberOptions.map((m) => [m.name.toLowerCase(), m.id])),
    [memberOptions]
  );

  const tokenObj = useMemo(() => {
    if (!token) return null;
    return tokens.find((t) => t.id === token) ?? null;
  }, [token, tokens]);

  const tokenValid = useMemo(() => {
    if (!tokenObj) return false;
    if (tokenObj.scope === 'member' && tokenObj.usedAt) return false;
    return Date.parse(tokenObj.expiresAt) > Date.now();
  }, [tokenObj]);

  const event = useMemo(() => {
    if (!tokenObj) return null;
    return events.find((e) => e.id === tokenObj.eventId) ?? null;
  }, [events, tokenObj]);

  const startAtIso = useMemo(() => {
    if (!event) return null;
    return toStartAtIso(event.date, event.time);
  }, [event]);

  const authUser = useMemo(() => getAuthUser(), []);
  const authMemberId = useMemo(() => {
    const email = authUser?.email?.trim().toLowerCase();
    if (!email) return null;
    const match = members.find((m) => m.email?.trim().toLowerCase() === email);
    return match?.id ?? null;
  }, [authUser?.email, members]);

  const [tab, setTab] = useState<'member' | 'guest'>('member');
  const [memberName, setMemberName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('present');

  const autoRanRef = useRef(false);

  useEffect(() => {
    if (!tokenObj || !tokenValid) return;
    if (!event) return;
    if (autoRanRef.current) return;

    const computed = computeStatus(startAtIso);
    setStatus(computed);

    if (authMemberId) {
      autoRanRef.current = true;
      const existing = records.find(
        (r) =>
          r.attendeeType === 'member' &&
          r.memberId === authMemberId &&
          r.eventId === tokenObj.eventId
      );

      if (existing) {
        updateRecord(existing.id, {
          status: computed,
          checkinMethod: 'qr',
          checkedInAt: new Date().toISOString(),
          checkedInBy: 'self',
        });
      } else {
        upsertRecord({
          id: createAttendanceId(),
          eventId: tokenObj.eventId,
          attendeeType: 'member',
          memberId: authMemberId,
          status: computed,
          checkinMethod: 'qr',
          checkedInAt: new Date().toISOString(),
          checkedInBy: 'self',
        });
      }

      if (tokenObj.scope === 'member') markTokenUsed(tokenObj.id);
      toast.success('Checked in', 'Thank you for attending.');
      window.setTimeout(() => navigate('/'), 700);
      return;
    }

    if (!authUser) {
      autoRanRef.current = true;
      const guestFullName = createGuestName();
      setTab('guest');
      setGuestName(guestFullName);
      upsertRecord({
        id: createAttendanceId(),
        eventId: tokenObj.eventId,
        attendeeType: 'guest',
        guest: {
          fullName: guestFullName,
        },
        status: computed,
        checkinMethod: 'qr',
        checkedInAt: new Date().toISOString(),
        checkedInBy: 'self',
        notes: 'QR guest check-in',
      });
      toast.success('Checked in', 'Welcome!');
      window.setTimeout(() => navigate('/'), 700);
    }
  }, [
    authMemberId,
    authUser,
    event,
    markTokenUsed,
    navigate,
    records,
    startAtIso,
    toast,
    tokenObj,
    tokenValid,
    updateRecord,
    upsertRecord,
  ]);

  const canSubmitMember = Boolean(memberByName.get(memberName.trim().toLowerCase()));
  const canSubmitGuest = Boolean(guestName.trim());

  if (!tokenObj) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="jhtm-card mx-auto w-full max-w-lg p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky p-2">
              <QrCode className="text-navy" size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">Invalid check-in link</p>
              <p className="mt-1 text-sm text-slate-600">Ask an admin to generate a new QR link.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="jhtm-card mx-auto w-full max-w-lg p-6">
          <p className="text-lg font-extrabold text-slate-900">Check-in link expired</p>
          <p className="mt-2 text-sm text-slate-600">
            Ask an admin to regenerate the QR check-in link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Check-in</p>
          <h1 className="mt-2 text-2xl font-extrabold">{event?.name ?? 'Service'}</h1>
          <p className="mt-2 text-sm text-white/85">
            {event ? `${event.date} · ${event.time} · ${event.location}` : ''}
          </p>
        </div>

        <div className="jhtm-card p-5">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab('member')}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                tab === 'member'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Users2 size={18} aria-hidden="true" />
              Member
            </button>
            <button
              type="button"
              onClick={() => setTab('guest')}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                tab === 'guest'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <UserPlus2 size={18} aria-hidden="true" />
              Guest
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              >
                <option value="present">I'm Here 🙏</option>
                <option value="late">Late</option>
                <option value="expected">Expected / Early</option>
                <option value="excused">Excused</option>
              </select>
              <p className="text-xs text-slate-500">
                QR scans automatically mark you as Present or Late based on service start time.
              </p>
            </div>

            {tab === 'member' ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Member</label>
                <input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  list="member-options"
                  placeholder="Search member name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                />
                <datalist id="member-options">
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Guest name</label>
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Phone"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email (optional)
                  </label>
                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={tab === 'member' ? !canSubmitMember : !canSubmitGuest}
              onClick={() => {
                const eventId = tokenObj.eventId;
                const checkedInAt = new Date().toISOString();
                if (tab === 'member') {
                  const memberId = memberByName.get(memberName.trim().toLowerCase());
                  if (!memberId) return;

                  const existing = records.find(
                    (r) =>
                      r.attendeeType === 'member' &&
                      r.memberId === memberId &&
                      r.eventId === eventId
                  );
                  if (existing) {
                    updateRecord(existing.id, {
                      status,
                      checkinMethod: 'qr',
                      checkedInAt,
                      checkedInBy: 'self',
                    });
                  } else {
                    upsertRecord({
                      id: createAttendanceId(),
                      eventId,
                      attendeeType: 'member',
                      memberId,
                      status,
                      checkinMethod: 'qr',
                      checkedInAt,
                      checkedInBy: 'self',
                    });
                  }
                } else {
                  upsertRecord({
                    id: createAttendanceId(),
                    eventId,
                    attendeeType: 'guest',
                    guest: {
                      fullName: guestName.trim(),
                      phone: guestPhone.trim() || undefined,
                      email: guestEmail.trim() || undefined,
                    },
                    status,
                    checkinMethod: 'qr',
                    checkedInAt,
                    checkedInBy: 'self',
                  });
                }

                if (tokenObj.scope === 'member') markTokenUsed(tokenObj.id);
                toast.success('Checked in', 'Thank you for attending.');
                window.setTimeout(() => navigate('/'), 700);
              }}
              className="jhtm-btn jhtm-btn-primary h-11 w-full gap-2 shadow-sm"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              Confirm check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
