import React, { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import {
  createAttendanceId,
  type AttendanceRecord,
  useAttendanceStore,
} from '@/stores/attendanceStore';
import { useEventRegistrationsStore } from '@/stores/eventRegistrationsStore';
import { type EventItem, useEventsStore } from '@/stores/eventsStore';

type EventKind = 'service' | 'registration' | 'informational';

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

function eventStartAt(event: EventItem): string {
  const time = event.time?.length ? event.time : '00:00';
  const iso = `${event.date}T${time}`;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function isServiceLike(event: EventItem) {
  const cat = (event.category ?? '').toLowerCase();
  const name = (event.name ?? '').toLowerCase();
  return (
    cat === 'service' ||
    cat === 'prayer' ||
    cat === 'worship' ||
    name.includes('service') ||
    name.includes('worship') ||
    name.includes('prayer')
  );
}

function kindForEvent(event: EventItem): EventKind {
  if (event.requiresRegistration) return 'registration';
  if (isServiceLike(event)) return 'service';
  if (typeof event.maxSlots === 'number' && event.maxSlots > 0) return 'registration';
  return 'informational';
}

function categoryLabel(event: EventItem) {
  if (event.category) return event.category;
  if (isServiceLike(event)) return 'Service';
  return 'Other';
}

function getCategoryColor(category: string) {
  const c = category.toLowerCase();
  if (c === 'service' || c === 'worship') return 'bg-sky-100 text-navy';
  if (c === 'prayer') return 'bg-purple-100 text-purple-700';
  if (c === 'youth') return 'bg-amber-100 text-amber-700';
  if (c === 'family' || c === 'fellowship') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function statusPill(status: AttendanceRecord['status']) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'late') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-200 text-slate-700';
}

export default function PortalEvents() {
  const toast = useToast();
  const memberId = getCurrentMemberId();
  const [filter, setFilter] = useState<string>('All');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const events = useEventsStore((s) => s.events);

  const attendanceRecords = useAttendanceStore((s) => s.records);
  const upsertAttendance = useAttendanceStore((s) => s.upsertRecord);

  const registrations = useEventRegistrationsStore((s) => s.registrations);
  const joinEvent = useEventRegistrationsStore((s) => s.joinEvent);
  const leaveEvent = useEventRegistrationsStore((s) => s.leaveEvent);
  const countForEvent = useEventRegistrationsStore((s) => s.countForEvent);

  const upcoming = useMemo(() => {
    const nowIso = new Date().toISOString();
    return [...events]
      .filter((e) => e.status !== 'Cancelled' && e.status !== 'Completed')
      .filter((e) => eventStartAt(e) >= nowIso)
      .sort((a, b) => eventStartAt(a).localeCompare(eventStartAt(b)));
  }, [events]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of upcoming) set.add(categoryLabel(e));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [upcoming]);

  const filteredEvents = useMemo(() => {
    if (filter === 'All') return upcoming;
    return upcoming.filter((e) => categoryLabel(e) === filter);
  }, [filter, upcoming]);

  const activeEvent = useMemo(() => {
    if (!activeEventId) return null;
    return upcoming.find((e) => e.id === activeEventId) ?? null;
  }, [activeEventId, upcoming]);

  const attendanceEventId = (event: EventItem) => {
    return event.id;
  };

  const attendanceForEvent = (event: EventItem) => {
    const eid = attendanceEventId(event);
    return (
      attendanceRecords
        .filter((r) => r.attendeeType === 'member')
        .filter((r) => (r.memberId ?? '') === memberId)
        .find((r) => r.eventId === eid) ?? null
    );
  };

  const isRegistered = (event: EventItem) => {
    return registrations.some((r) => r.eventId === event.id && r.memberId === memberId);
  };

  const maxSlotsForEvent = (event: EventItem) => {
    if (typeof event.maxSlots === 'number' && event.maxSlots > 0) return event.maxSlots;
    return 50;
  };

  const remainingSpots = (event: EventItem) => {
    const max = maxSlotsForEvent(event);
    const used = countForEvent(event.id);
    return Math.max(0, max - used);
  };

  const openDetails = (id: string) => {
    setActiveEventId(id);
    setDetailsOpen(true);
  };

  const onJoinService = (event: EventItem) => {
    const existing = attendanceForEvent(event);
    if (existing) return;
    const now = new Date();
    const start = new Date(eventStartAt(event));
    const isLate = now.getTime() > start.getTime() + 10 * 60_000;
    const status: AttendanceRecord['status'] = isLate ? 'late' : 'present';

    upsertAttendance({
      id: createAttendanceId(),
      eventId: attendanceEventId(event),
      attendeeType: 'member',
      memberId,
      status,
      checkinMethod: 'manual',
      checkedInAt: now.toISOString(),
      checkedInBy: 'self',
      notes: event.name,
    });
    toast.success('Joined', 'Attendance has been recorded.');
  };

  const onJoinRegistration = (event: EventItem) => {
    if (isRegistered(event)) return;
    if (remainingSpots(event) <= 0) {
      toast.error('Full', 'No remaining slots for this event.');
      return;
    }
    const ok = joinEvent({ eventId: event.id, memberId });
    if (ok) toast.success('Joined', 'You have joined this event.');
  };

  const onLeaveRegistration = (event: EventItem) => {
    if (!isRegistered(event)) return;
    leaveEvent({ eventId: event.id, memberId });
    toast.info('Left event', 'You have left this event.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Church Events</h1>
        <p className="mt-1 text-slate-500">Browse upcoming services and events</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              filter === cat
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* My Registrations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">My Registrations</h2>
        <div className="mt-4 space-y-3">
          {upcoming
            .filter((e) => kindForEvent(e) === 'registration')
            .filter((e) => isRegistered(e))
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <CheckCircle className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{event.name}</p>
                    <p className="text-sm text-slate-500">
                      {event.date} • {event.time}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onLeaveRegistration(event)}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Leave Event ❌
                </button>
              </div>
            ))}
          {upcoming.filter((e) => kindForEvent(e) === 'registration').filter((e) => isRegistered(e))
            .length === 0 && (
            <p className="text-slate-500">You haven't registered for any events yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) =>
            (() => {
              const category = categoryLabel(event);
              const kind = kindForEvent(event);
              const joinedAttendance = kind === 'service' ? attendanceForEvent(event) : null;
              const joinedRegistration = kind === 'registration' ? isRegistered(event) : false;
              const maxSlots = kind === 'registration' ? maxSlotsForEvent(event) : null;
              const remaining = kind === 'registration' ? remainingSpots(event) : null;
              const isFull = kind === 'registration' ? remaining === 0 : false;

              return (
                <div
                  key={event.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sea-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        getCategoryColor(category)
                      )}
                    >
                      {category}
                    </span>
                    {joinedAttendance ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusPill(joinedAttendance.status)
                        )}
                      >
                        <CheckCircle size={12} aria-hidden="true" />
                        {joinedAttendance.status === 'late' ? 'Late' : 'Present'}
                      </span>
                    ) : joinedRegistration ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle size={12} aria-hidden="true" />
                        Joined ✅
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">{event.name}</h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <Calendar size={16} />
                      {event.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={16} />
                      {event.time}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={16} />
                      {event.location}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    {kind === 'registration' ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={16} aria-hidden="true" />
                        <span>
                          {remaining} / {maxSlots} spots left
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={16} aria-hidden="true" />
                        <span>No registration needed</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDetails(event.id)}
                        className="jhtm-btn jhtm-btn-ghost h-9 px-3"
                      >
                        View Details
                      </button>

                      {kind === 'service' ? (
                        <button
                          type="button"
                          onClick={() => onJoinService(event)}
                          disabled={Boolean(joinedAttendance)}
                          className={cn(
                            'jhtm-btn jhtm-btn-primary h-9 px-3',
                            joinedAttendance && 'opacity-60'
                          )}
                        >
                          {joinedAttendance ? 'Joined ✅' : 'Join Service'}
                        </button>
                      ) : kind === 'registration' ? (
                        joinedRegistration ? (
                          <>
                            <button
                              type="button"
                              disabled
                              className="jhtm-btn jhtm-btn-primary h-9 px-3 opacity-60"
                            >
                              Joined ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => onLeaveRegistration(event)}
                              className="jhtm-btn jhtm-btn-ghost h-9 px-3 border border-slate-200"
                            >
                              Leave Event ❌
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onJoinRegistration(event)}
                            disabled={isFull}
                            className={cn(
                              'jhtm-btn jhtm-btn-primary h-9 px-3',
                              isFull && 'opacity-60'
                            )}
                          >
                            Join Event ✨
                            <ArrowRight size={16} aria-hidden="true" />
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Events Found</h3>
          <p className="mt-2 text-slate-500">There are no events in this category at the moment.</p>
        </div>
      )}

      <Modal
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setActiveEventId(null);
        }}
        title="Event Details"
      >
        {activeEvent ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{categoryLabel(activeEvent)}</p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900">{activeEvent.name}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeEvent.date}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Time</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeEvent.time}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Location
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeEvent.location}</p>
              </div>
            </div>

            {kindForEvent(activeEvent) === 'registration' ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Registration</p>
                <p className="mt-1 text-sm text-slate-600">
                  {remainingSpots(activeEvent)} / {maxSlotsForEvent(activeEvent)} spots remaining
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Attendance</p>
                <p className="mt-1 text-sm text-slate-600">No registration needed.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No event selected.</div>
        )}
      </Modal>
    </div>
  );
}
