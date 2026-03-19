import React, { useMemo, useState } from 'react';
import { CalendarClock, TrendingUp, Filter, Download } from 'lucide-react';

import { cn } from '@/lib/utils';
import { type AttendanceRecord, useAttendanceStore } from '@/stores/attendanceStore';
import { type EventItem, useEventsStore } from '@/stores/eventsStore';
import { getCurrentMemberId } from '@/lib/memberIdentity';

type FilterValue = 'All' | 'Present' | 'Late' | 'Excused / Absent';

function toLocalDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function toLocalTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function toUiStatus(status: AttendanceRecord['status']): FilterValue {
  if (status === 'present') return 'Present';
  if (status === 'expected') return 'Excused / Absent';
  if (status === 'late') return 'Late';
  return 'Excused / Absent';
}

function getStatusColor(status: AttendanceRecord['status']) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'expected') return 'bg-slate-200 text-slate-700';
  if (status === 'late') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-200 text-slate-700';
}

function isServiceLike(event: EventItem) {
  const cat = (event.category ?? '').toLowerCase();
  const name = (event.name ?? '').toLowerCase();
  return (
    cat === 'service' ||
    cat === 'prayer' ||
    cat === 'worship' ||
    cat === 'youth' ||
    name.includes('service') ||
    name.includes('worship') ||
    name.includes('prayer')
  );
}

export default function PortalAttendance() {
  const [filter, setFilter] = useState<FilterValue>('All');

  const memberId = getCurrentMemberId();
  const records = useAttendanceStore((s) => s.records);
  const events = useEventsStore((s) => s.events);

  const serviceEventIds = useMemo(() => {
    return new Set(events.filter((e) => isServiceLike(e)).map((e) => e.id));
  }, [events]);

  const eventNameById = useMemo(() => {
    return new Map(events.map((e) => [e.id, e.name]));
  }, [events]);

  const memberServiceRecords = useMemo(() => {
    return records
      .filter((r) => r.attendeeType === 'member')
      .filter((r) => (r.memberId ?? '') === memberId)
      .filter((r) => serviceEventIds.has(r.eventId))
      .filter((r) => r.status !== 'removed')
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [memberId, records, serviceEventIds]);

  const filteredRecords = useMemo(() => {
    if (filter === 'All') return memberServiceRecords;
    return memberServiceRecords.filter((r) => toUiStatus(r.status) === filter);
  }, [filter, memberServiceRecords]);

  const stats = useMemo(() => {
    const total = memberServiceRecords.length;
    const present = memberServiceRecords.filter((r) => r.status === 'present').length;
    const late = memberServiceRecords.filter((r) => r.status === 'late').length;
    const excusedAbsent = memberServiceRecords.filter(
      (r) => r.status === 'excused' || r.status === 'expected'
    ).length;
    const attended = memberServiceRecords.filter(
      (r) => r.status === 'present' || r.status === 'late'
    ).length;
    const rate = total ? Math.round((attended / total) * 100) : 0;
    return { total, present, late, excusedAbsent, rate };
  }, [memberServiceRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
          <p className="mt-1 text-slate-500">View your service attendance history</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <Download size={18} />
          Export History
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Services</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-sky-100 p-3">
              <CalendarClock className="text-navy" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Present</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.present}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Late Arrivals</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.late}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3">
              <CalendarClock className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Attendance Rate</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.rate}%</p>
            </div>
            <div className="rounded-xl bg-purple-100 p-3">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="text-slate-400" size={20} />
        <span className="text-sm font-semibold text-slate-600">Filter:</span>
        {(['All', 'Present', 'Late', 'Excused / Absent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Service
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Check-in Time
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">
                      {eventNameById.get(record.eventId) || record.notes || 'Service'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {toLocalDateLabel(record.checkedInAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {toLocalTimeLabel(record.checkedInAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        getStatusColor(record.status)
                      )}
                    >
                      {toUiStatus(record.status)}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    No attendance records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
