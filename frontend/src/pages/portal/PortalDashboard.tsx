import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, Heart, Calendar, User } from 'lucide-react';

import { usePrayerRequestsStore } from '@/stores/prayerRequestsStore';
import { cn } from '@/lib/utils';
import { type AttendanceRecord, useAttendanceStore } from '@/stores/attendanceStore';

type PortalService = {
  id: string;
  name: string;
  startAt: string;
  location?: string;
};

function getCurrentMemberId(): string {
  if (typeof window === 'undefined') return 'member';
  try {
    const raw = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!raw) return 'member';
    const parsed = JSON.parse(raw) as { email?: string };
    return parsed.email?.trim() || 'member';
  } catch {
    return 'member';
  }
}

function serviceEventId(service: PortalService) {
  return `service:${service.id}:${service.startAt}`;
}

function toLocalDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function toLocalTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function createStartAt(daysFromNow: number, hours: number, minutes: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function statusPill(status: AttendanceRecord['status']) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'late') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-200 text-slate-700';
}

export default function PortalDashboard() {
  const navigate = useNavigate();

  const loadMyPrayerRequests = usePrayerRequestsStore((s) => s.loadMyRequests);
  const myPrayerRequests = usePrayerRequestsStore((s) => s.myRequests);

  const records = useAttendanceStore((s) => s.records);
  const upsertRecord = useAttendanceStore((s) => s.upsertRecord);

  useEffect(() => {
    void loadMyPrayerRequests();
  }, [loadMyPrayerRequests]);

  const memberName = 'John Smith';
  const memberId = getCurrentMemberId();

  const upcomingServices = useMemo<PortalService[]>(
    () =>
      [
        {
          id: 'sunday-worship',
          name: 'Sunday Worship',
          startAt: createStartAt(1, 9, 0),
          location: 'Main Sanctuary',
        },
        {
          id: 'prayer-meeting',
          name: 'Prayer Meeting',
          startAt: createStartAt(3, 19, 0),
          location: 'Fellowship Hall',
        },
      ].sort((a, b) => a.startAt.localeCompare(b.startAt)),
    []
  );

  const memberServiceRecords = useMemo(() => {
    return records
      .filter((r) => r.attendeeType === 'member')
      .filter((r) => (r.memberId ?? '') === memberId)
      .filter((r) => r.eventId.startsWith('service:'))
      .filter((r) => r.status !== 'removed');
  }, [memberId, records]);

  const servicesAttended = useMemo(() => {
    return memberServiceRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  }, [memberServiceRecords]);

  const checkinsThisMonth = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return memberServiceRecords.filter((r) => {
      const d = new Date(r.checkedInAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [memberServiceRecords]);

  const recordForService = (service: PortalService) => {
    const eid = serviceEventId(service);
    return memberServiceRecords.find((r) => r.eventId === eid) ?? null;
  };

  const markJoined = (service: PortalService) => {
    const now = new Date();
    const start = new Date(service.startAt);
    const isLate = now.getTime() > start.getTime() + 10 * 60_000;
    const status: AttendanceRecord['status'] = isLate ? 'late' : 'present';
    const eventId = serviceEventId(service);
    const id = `self:${memberId}:${eventId}`;

    upsertRecord({
      id,
      eventId,
      attendeeType: 'member',
      memberId,
      status,
      checkinMethod: 'manual',
      checkedInAt: now.toISOString(),
      checkedInBy: 'self',
      notes: service.name,
    });
  };

  const stats = useMemo(
    () => [
      {
        label: 'Services Attended',
        value: String(servicesAttended),
        icon: CalendarClock,
        color: 'bg-sky-100 text-navy',
      },
      {
        label: 'Check-ins This Month',
        value: String(checkinsThisMonth),
        icon: ClipboardCheck,
        color: 'bg-sea-100 text-navy',
      },
      {
        label: 'Prayer Requests',
        value: String(myPrayerRequests.length),
        icon: Heart,
        color: 'bg-sky-50 text-navy',
      },
      {
        label: 'Upcoming Events',
        value: '4',
        icon: Calendar,
        color: 'bg-sky-100 text-navy',
      },
    ],
    [checkinsThisMonth, myPrayerRequests.length, servicesAttended]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-navy to-sea p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {memberName}!</h1>
        <p className="mt-1 text-white/80">We're glad to have you as part of JHTM Church.</p>
        <div className="mt-4 flex gap-3">
          {(() => {
            const nextService = upcomingServices[0];
            const joined = nextService ? recordForService(nextService) : null;
            const showEarly = nextService ? new Date() < new Date(nextService.startAt) : false;
            return (
              <>
                {showEarly ? (
                  <button
                    type="button"
                    onClick={() => nextService && markJoined(nextService)}
                    disabled={Boolean(joined)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60',
                      joined && 'cursor-not-allowed'
                    )}
                  >
                    <ClipboardCheck size={18} aria-hidden="true" />
                    {joined ? 'Joined ✅' : "I'll Attend"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => nextService && markJoined(nextService)}
                  disabled={Boolean(joined)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-sky-50 disabled:opacity-60',
                    joined && 'cursor-not-allowed'
                  )}
                >
                  <ClipboardCheck size={18} aria-hidden="true" />
                  {joined ? 'Joined ✅' : "I'm Here 🙏"}
                </button>
              </>
            );
          })()}
          <button
            onClick={() => navigate('/portal/prayers')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Heart size={18} />
            Submit Prayer Request
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => {
              if (stat.label.includes('Check-ins')) navigate('/portal/attendance');
              else if (stat.label.includes('Prayer')) navigate('/portal/prayers');
              else if (stat.label.includes('Upcoming')) navigate('/portal/events');
              else if (stat.label.includes('Services')) navigate('/portal/attendance');
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-sea-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/portal/profile')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-slate-100 p-2">
              <User className="text-slate-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Update Profile</p>
              <p className="text-xs text-slate-500">Keep your info current</p>
            </div>
          </button>

          <button
            onClick={() => {
              const nextService = upcomingServices[0];
              if (nextService) markJoined(nextService);
            }}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-sky-100 p-2">
              <ClipboardCheck className="text-navy" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">I'm Here 🙏</p>
              <p className="text-xs text-slate-500">Mark attendance for services</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/portal/prayers')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-sea-100 p-2">
              <Heart className="text-navy" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Prayer Request</p>
              <p className="text-xs text-slate-500">Share your needs</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/portal/events')}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="rounded-lg bg-sky-100 p-2">
              <Calendar className="text-navy" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">View Events</p>
              <p className="text-xs text-slate-500">Browse upcoming events</p>
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">My Prayer Requests</h2>
          <button
            onClick={() => navigate('/portal/prayers')}
            className="text-sm font-semibold text-navy hover:text-navy-700"
          >
            View All
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {myPrayerRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">No requests yet</p>
              <p className="mt-1 text-sm text-slate-600">
                Share a prayer request and it will show up here instantly.
              </p>
              <button
                onClick={() => navigate('/portal/prayers')}
                className="jhtm-btn jhtm-btn-primary mt-4 h-10"
              >
                Share a Prayer 🙏
              </button>
            </div>
          ) : (
            myPrayerRequests.slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Submitted
                  </span>
                  {r.isAnonymous ? (
                    <span className="text-xs font-semibold text-slate-500">Anonymous</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-slate-900">{r.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Services */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Services</h2>
          <button
            onClick={() => navigate('/portal/events')}
            className="text-sm font-semibold text-navy hover:text-navy-700"
          >
            View All
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingServices.map((service) => {
            const joined = recordForService(service);
            const showEarly = new Date() < new Date(service.startAt);
            return (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500">
                    {toLocalDateLabel(service.startAt)} at {toLocalTimeLabel(service.startAt)}
                  </p>
                  {service.location ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500">{service.location}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {joined ? (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        statusPill(joined.status)
                      )}
                    >
                      {joined.status === 'late' ? 'Late' : 'Present'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      Not yet
                    </span>
                  )}

                  {showEarly ? (
                    <button
                      type="button"
                      onClick={() => markJoined(service)}
                      disabled={Boolean(joined)}
                      className={cn(
                        'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60',
                        joined && 'cursor-not-allowed'
                      )}
                    >
                      {joined ? 'Joined ✅' : "I'll Attend"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => markJoined(service)}
                    disabled={Boolean(joined)}
                    className={cn(
                      'rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60',
                      joined && 'cursor-not-allowed'
                    )}
                  >
                    {joined ? 'Joined ✅' : "I'm Here 🙏"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
