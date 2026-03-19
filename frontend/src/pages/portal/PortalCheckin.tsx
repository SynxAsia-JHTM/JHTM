import React, { useMemo, useState } from 'react';
import { ClipboardCheck, QrCode, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';

import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import { type AttendanceRecord, useAttendanceStore } from '@/stores/attendanceStore';
import { type EventItem, useEventsStore } from '@/stores/eventsStore';

type Service = {
  event: EventItem;
  startAt: string;
};

function toLocalDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function toLocalTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function eventStartAtIso(event: EventItem) {
  const time = event.time?.length ? event.time : '00:00';
  const iso = `${event.date}T${time}`;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
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

export default function PortalCheckin() {
  const toast = useToast();
  const { events, loadEvents } = useEventsStore();
  const services = useMemo<Service[]>(() => {
    const nowIso = new Date().toISOString();
    return [...events]
      .filter((e) => e.status !== 'Cancelled' && e.status !== 'Completed')
      .filter((e) => isServiceLike(e))
      .map((e) => ({ event: e, startAt: eventStartAtIso(e) }))
      .filter((s): s is { event: EventItem; startAt: string } => Boolean(s.startAt))
      .filter((s) => s.startAt >= nowIso)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 8);
  }, [events]);

  const [showQR, setShowQR] = useState(false);

  const { myRecords, loadMine, selfAttend } = useAttendanceStore();

  React.useEffect(() => {
    void loadEvents();
    void loadMine();
  }, [loadEvents, loadMine]);

  const memberServiceRecords = useMemo(() => {
    const serviceIds = new Set(events.filter((e) => isServiceLike(e)).map((e) => e.id));
    return myRecords
      .filter((r) => serviceIds.has(r.eventId))
      .filter((r) => r.status !== 'removed')
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [events, myRecords]);

  const recordForService = (service: Service) => {
    return memberServiceRecords.find((r) => r.eventId === service.event.id) ?? null;
  };

  const markExpected = async (service: Service) => {
    const existing = recordForService(service);
    if (existing && (existing.status === 'present' || existing.status === 'late')) return;
    const ok = await selfAttend({ eventId: service.event.id, status: 'expected' });
    if (ok) toast.success('Marked', 'Expected / Early attendance saved.');
    else toast.error('Unable to record', 'Please try again.');
  };

  const markHere = async (service: Service) => {
    const now = new Date();
    const start = new Date(service.startAt);
    const isLate = now.getTime() > start.getTime() + 10 * 60_000;
    const status: AttendanceRecord['status'] = isLate ? 'late' : 'present';
    const ok = await selfAttend({ eventId: service.event.id, status });
    if (ok) toast.success('Recorded', 'Thank you for attending.');
    else toast.error('Unable to record', 'Please try again.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Check-in</h1>
        <p className="mt-1 text-slate-500">
          Mark attendance for worship services and prayer meetings
        </p>
      </div>

      {/* Quick Check-in Options */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Manual Check-in */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-3">
              <ClipboardCheck className="text-navy" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Manual Check-in</h3>
              <p className="text-sm text-slate-500">Tap when you arrive (or mark early)</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {services.map((service) =>
              (() => {
                const joined = recordForService(service);
                const showEarly = new Date() < new Date(service.startAt);
                return (
                  <div
                    key={service.event.id}
                    className={`rounded-xl border p-4 ${
                      joined ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{service.event.name}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {toLocalDateLabel(service.startAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {toLocalTimeLabel(service.startAt)}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <MapPin size={14} />
                          {service.event.location}
                        </p>
                      </div>

                      {joined ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle size={20} />
                          <span className="text-sm font-semibold">Joined ✅</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {showEarly ? (
                            <button
                              type="button"
                              onClick={() => markExpected(service)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              I'll Attend
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => markHere(service)}
                            className={cn(
                              'rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600'
                            )}
                          >
                            I'm Here 🙏
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* QR Code Check-in */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3">
              <QrCode className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">QR Code Check-in</h3>
              <p className="text-sm text-slate-500">Show this code at the entrance</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            {showQR ? (
              <div className="rounded-2xl bg-white p-4 shadow-inner">
                <div className="h-48 w-48 rounded-lg bg-slate-100 flex items-center justify-center">
                  {/* QR Code placeholder - in real app would generate actual QR */}
                  <div className="text-center">
                    <QrCode size={64} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-xs text-slate-500">JHTM-001</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-purple-400 hover:bg-purple-50"
              >
                <QrCode size={48} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-600">Tap to show QR Code</p>
              </button>
            )}

            {showQR && (
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Hide QR Code
              </button>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              <strong>Tip:</strong> Show this QR code to the ushers when you arrive at the service
              for quick check-in.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Recent Check-ins</h3>
        <div className="mt-4 space-y-3">
          {memberServiceRecords.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{r.notes || 'Service'}</p>
                  <p className="text-sm text-slate-500">{toLocalDateLabel(r.checkedInAt)}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-500">
                {toLocalTimeLabel(r.checkedInAt)}
              </span>
            </div>
          ))}

          {memberServiceRecords.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">No check-ins yet</p>
              <p className="mt-1 text-sm text-slate-600">
                Tap “I'm Here 🙏” on a service to mark attendance.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
