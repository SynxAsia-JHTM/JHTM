import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, QrCode, Search, UserPlus2, Users2, X } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { loadMembers } from '@/lib/memberData';
import { formatDashboardDateTime, formatEventDateShort } from '@/lib/eventFormat';
import {
  createAttendanceId,
  createTokenId,
  type AttendanceRecord,
  type AttendanceStatus,
  type GuestProfile,
  useAttendanceStore,
} from '@/stores/attendanceStore';
import { useEventsStore } from '@/stores/eventsStore';

type FilterState = {
  date: string;
  eventId: string;
  memberQuery: string;
};

function isSameDay(dateIso: string, filterIso: string) {
  return dateIso === filterIso;
}

function getAttendeeName(record: AttendanceRecord, membersById: Map<string, { name: string }>) {
  if (record.attendeeType === 'member' && record.memberId) {
    return membersById.get(record.memberId)?.name ?? 'Member';
  }
  return record.guest?.fullName ?? 'Guest';
}

function statusPill(status: AttendanceStatus) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'late') return 'bg-amber-100 text-amber-800';
  if (status === 'excused') return 'bg-slate-200 text-slate-700';
  return 'bg-red-100 text-red-700';
}

export default function Attendance() {
  const toast = useToast();
  const events = useEventsStore((s) => s.events);
  const records = useAttendanceStore((s) => s.records);
  const createToken = useAttendanceStore((s) => s.createToken);
  const removeRecord = useAttendanceStore((s) => s.removeRecord);
  const upsertRecord = useAttendanceStore((s) => s.upsertRecord);

  const members = useMemo(() => loadMembers(), []);
  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, { name: m.name }])),
    [members]
  );

  const [filters, setFilters] = useState<FilterState>({
    date: '',
    eventId: '',
    memberQuery: '',
  });

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinTab, setCheckinTab] = useState<'member' | 'guest'>('member');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState<string | null>(null);

  const eventOptions = useMemo(() => {
    return [...events]
      .filter((e) => e.status !== 'Cancelled')
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [events]);

  const filteredRecords = useMemo(() => {
    const q = filters.memberQuery.trim().toLowerCase();
    return records
      .filter((r) => (filters.eventId ? r.eventId === filters.eventId : true))
      .filter((r) => {
        if (!filters.date) return true;
        const event = events.find((e) => e.id === r.eventId);
        if (!event) return false;
        return isSameDay(event.date, filters.date);
      })
      .filter((r) => {
        if (!q) return true;
        const name = getAttendeeName(r, membersById).toLowerCase();
        const extra = [r.guest?.email ?? '', r.guest?.phone ?? ''].join(' ').toLowerCase();
        return name.includes(q) || extra.includes(q);
      })
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [events, filters.date, filters.eventId, filters.memberQuery, membersById, records]);

  const summary = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const guests = filteredRecords.filter((r) => r.attendeeType === 'guest').length;
    return { present, late, guests, total: filteredRecords.length };
  }, [filteredRecords]);

  const selectedEvent = useMemo(() => {
    if (!filters.eventId) return null;
    return events.find((e) => e.id === filters.eventId) ?? null;
  }, [events, filters.eventId]);

  const defaultEventId = eventOptions[0]?.id ?? '';

  const onOpenCheckin = () => {
    if (!filters.eventId && defaultEventId) {
      setFilters((p) => ({ ...p, eventId: defaultEventId }));
    }
    setCheckinOpen(true);
  };

  const onGenerateQr = () => {
    const eventId = filters.eventId || defaultEventId;
    if (!eventId) {
      toast.error('Select an event first');
      return;
    }

    const tokenId = createTokenId();
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    createToken({ id: tokenId, eventId, scope: 'service', expiresAt });
    const url = `${window.location.origin}/checkin/${tokenId}`;
    setActiveQrUrl(url);
    setQrOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="jhtm-card p-6">
        <div className="rounded-2xl bg-gradient-to-br from-navy via-sea to-cream p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Attendance</h1>
              <p className="mt-1 text-white/80">
                Track attendance per service with fast check-in tools
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenCheckin}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <UserPlus2 size={18} aria-hidden="true" />
                Check-in
              </button>
              <button
                type="button"
                onClick={onGenerateQr}
                className="jhtm-btn jhtm-btn-primary h-11"
              >
                <QrCode size={18} aria-hidden="true" />
                QR Check-in
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="jhtm-card p-4">
            <p className="text-sm font-semibold text-slate-600">Present</p>
            <p className="mt-1 text-2xl font-extrabold text-navy">{summary.present}</p>
          </div>
          <div className="jhtm-card p-4">
            <p className="text-sm font-semibold text-slate-600">Guests</p>
            <p className="mt-1 text-2xl font-extrabold text-sea-700">{summary.guests}</p>
          </div>
          <div className="jhtm-card p-4">
            <p className="text-sm font-semibold text-slate-600">Late</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-700">{summary.late}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-slate-500" aria-hidden="true" />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  aria-label="Filter by date"
                />
                {filters.date ? (
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, date: '' }))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Clear date filter"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <select
                value={filters.eventId}
                onChange={(e) => setFilters((p) => ({ ...p, eventId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500 sm:w-auto"
                aria-label="Filter by event"
              >
                <option value="">All events</option>
                {eventOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({formatEventDateShort(e.date)})
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  value={filters.memberQuery}
                  onChange={(e) => setFilters((p) => ({ ...p, memberQuery: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
                  type="search"
                  placeholder="Search member or guest..."
                  aria-label="Search by member or guest"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <Users2 size={18} aria-hidden="true" />
              {summary.total} checked in
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">Attendance Records</h2>
          <p className="mt-1 text-sm text-slate-500">Filter by date, event, or member</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Attendee
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Event
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  When
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Method
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const event = events.find((e) => e.id === r.eventId);
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {getAttendeeName(r, membersById)}
                        </p>
                        {r.attendeeType === 'guest' ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {[r.guest?.phone, r.guest?.email].filter(Boolean).join(' · ')}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{r.attendeeType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{event?.name ?? 'Event'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {event ? formatDashboardDateTime(event.date, event.time) : r.checkedInAt}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{r.checkinMethod}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            statusPill(r.status)
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setDeleteId(r.id)}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                            aria-label="Remove attendance record"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CheckinModal
        open={checkinOpen}
        tab={checkinTab}
        setTab={setCheckinTab}
        onOpenChange={setCheckinOpen}
        members={members}
        events={eventOptions}
        selectedEventId={filters.eventId || defaultEventId}
        onCreate={(payload) => {
          upsertRecord(payload);
          toast.success('Checked in');
        }}
      />

      <QrModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        qrUrl={activeQrUrl}
        eventName={
          selectedEvent?.name ??
          eventOptions.find((e) => e.id === (filters.eventId || defaultEventId))?.name
        }
      />

      <ConfirmModal
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Remove record"
        description="This will remove the attendance entry."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!deleteId) return;
          removeRecord(deleteId);
          setDeleteId(null);
          toast.success('Record removed');
        }}
      />
    </div>
  );
}

function CheckinModal({
  open,
  onOpenChange,
  tab,
  setTab,
  members,
  events,
  selectedEventId,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: 'member' | 'guest';
  setTab: (tab: 'member' | 'guest') => void;
  members: Array<{ id: string; name: string; email: string; phone: string }>;
  events: Array<{ id: string; name: string; date: string; time: string }>;
  selectedEventId: string;
  onCreate: (record: AttendanceRecord) => void;
}) {
  const memberInputRef = useRef<HTMLInputElement | null>(null);
  const [eventId, setEventId] = useState(selectedEventId);
  const [memberName, setMemberName] = useState('');
  const [guest, setGuest] = useState<GuestProfile>({ fullName: '' });
  const [status, setStatus] = useState<AttendanceStatus>('present');

  const memberOptions = useMemo(() => members.map((m) => ({ id: m.id, name: m.name })), [members]);
  const memberByName = useMemo(() => {
    const map = new Map(memberOptions.map((m) => [m.name.toLowerCase(), m.id]));
    return map;
  }, [memberOptions]);

  const canSaveMember =
    tab === 'member' &&
    Boolean(memberByName.get(memberName.trim().toLowerCase())) &&
    Boolean(eventId);
  const canSaveGuest = tab === 'guest' && Boolean(guest.fullName.trim()) && Boolean(eventId);

  const reset = () => {
    setEventId(selectedEventId);
    setMemberName('');
    setGuest({ fullName: '' });
    setStatus('present');
    setTab('member');
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) window.setTimeout(() => reset(), 0);
      }}
      title="Manual Check-in"
      description="Check in a member or a guest for a selected service"
      initialFocusRef={memberInputRef}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({formatEventDateShort(e.date)})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              required
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab('member')}
            className={cn(
              'flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition',
              tab === 'member'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Member
          </button>
          <button
            type="button"
            onClick={() => setTab('guest')}
            className={cn(
              'flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition',
              tab === 'guest'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Guest
          </button>
        </div>

        {tab === 'member' ? (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Member</label>
            <input
              ref={memberInputRef}
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
            <p className="text-sm text-slate-500">Start typing to select a member.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Guest name</label>
              <input
                value={guest.fullName}
                onChange={(e) => setGuest((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Full name"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Phone (optional)</label>
              <input
                value={guest.phone ?? ''}
                onChange={(e) => setGuest((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Email (optional)</label>
              <input
                value={guest.email ?? ''}
                onChange={(e) => setGuest((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={tab === 'member' ? !canSaveMember : !canSaveGuest}
            onClick={() => {
              const recordBase: AttendanceRecord = {
                id: createAttendanceId(),
                eventId,
                attendeeType: tab,
                status,
                checkinMethod: 'manual',
                checkedInAt: new Date().toISOString(),
                checkedInBy: 'admin',
              };

              if (tab === 'member') {
                const memberId = memberByName.get(memberName.trim().toLowerCase());
                if (!memberId) return;
                onCreate({ ...recordBase, memberId });
                onOpenChange(false);
                return;
              }

              onCreate({ ...recordBase, guest: { ...guest, fullName: guest.fullName.trim() } });
              onOpenChange(false);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-600/60"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Check in
          </button>
        </div>
      </div>
    </Modal>
  );
}

function QrModal({
  open,
  onOpenChange,
  qrUrl,
  eventName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrUrl: string | null;
  eventName?: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="QR Check-in"
      description="Share this link or open it on a device to check in."
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{eventName ?? 'Service check-in'}</p>
          <p className="mt-1 text-sm text-slate-600">Valid for 10 minutes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Check-in URL</p>
          <p className="mt-2 break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900">
            {qrUrl ?? ''}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
