import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';
import {
  createEventId,
  type EventItem,
  type EventStatus,
  useEventsStore,
} from '@/stores/eventsStore';

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Pick<EventItem, 'name' | 'date' | 'time' | 'location' | 'status'>;

type EventForm = Omit<EventItem, 'id'>;

const venues = [
  'Main Sanctuary',
  'Chapel',
  'Community Hall',
  'Conference Room',
  'Music Room',
  'Fellowship Center',
  'Main Church',
];

const speakers = ['Pastor John', 'Pastor Grace', 'Guest Speaker', 'Youth Leader', 'Worship Team'];
const categories = ['Service', 'Prayer', 'Training', 'Outreach', 'Youth', 'Music', 'Fellowship'];

const addDraftKey = 'jhtm.events.addDraft.v1';

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function roundToNextQuarterHour(now: Date) {
  const ms = now.getTime();
  const minutes = now.getMinutes();
  const remainder = minutes % 15;
  const addMinutes = remainder === 0 ? 15 : 15 - remainder;
  const next = new Date(ms + addMinutes * 60_000);
  const hh = String(next.getHours()).padStart(2, '0');
  const mm = String(next.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function validate(form: EventForm) {
  const errors: Partial<Record<keyof EventForm, string>> = {};

  if (!form.name.trim()) errors.name = 'Event name is required.';
  if (!form.date.trim()) errors.date = 'Date is required.';
  if (!form.time.trim()) errors.time = 'Time is required.';
  if (!form.location.trim()) errors.location = 'Venue is required.';
  if (!form.status.trim()) errors.status = 'Status is required.';

  if (form.date && Number.isNaN(Date.parse(form.date))) errors.date = 'Use a valid date.';
  if (form.time && !/^\d{2}:\d{2}$/.test(form.time)) errors.time = 'Use a valid time.';

  return errors;
}

function isEmptyErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).every((v) => !v);
}

export default function Events() {
  const toast = useToast();
  const events = useEventsStore((s) => s.events);
  const addEvent = useEventsStore((s) => s.addEvent);
  const updateEvent = useEventsStore((s) => s.updateEvent);
  const deleteEvent = useEventsStore((s) => s.deleteEvent);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const editingEvent = useMemo(() => {
    if (!editEventId) return null;
    return events.find((e) => e.id === editEventId) ?? null;
  }, [editEventId, events]);

  const deletingEvent = useMemo(() => {
    if (!deleteEventId) return null;
    return events.find((e) => e.id === deleteEventId) ?? null;
  }, [deleteEventId, events]);

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? events.filter((e) => {
          const haystack = [
            e.name,
            e.date,
            e.time,
            e.location,
            e.status,
            e.category ?? '',
            e.speaker ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        })
      : events;

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (sortKey === 'date') {
        const aTime = Date.parse(aValue);
        const bTime = Date.parse(bValue);
        return (aTime - bTime) * directionMultiplier;
      }

      return compareStrings(String(aValue), String(bValue)) * directionMultiplier;
    });

    return sorted;
  }, [events, query, sortDirection, sortKey]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="mt-1 text-slate-500">Track and manage upcoming church events</p>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} aria-hidden="true" />
          Add Event
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Events List</h2>
            <p className="mt-1 text-sm text-slate-500">Search and sort events</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sea-200 focus:ring-2 focus:ring-sea-500"
              type="search"
              placeholder="Search by event, date, location..."
              aria-label="Search events"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60">
                <SortableTh label="Event" sortKey="name" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'name' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Date" sortKey="date" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'date' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Time" sortKey="time" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'time' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Location" sortKey="location" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'location' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} onSort={onSort}>
                  {sortKey === 'status' ? <SortIcon size={14} aria-hidden="true" /> : null}
                </SortableTh>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No events found.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{e.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{e.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{e.time}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{e.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusPill(e.status)
                        )}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditEventId(e.id);
                            setIsEditOpen(true);
                          }}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label={`Edit ${e.name}`}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEventId(e.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
                          aria-label={`Delete ${e.name}`}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEventModal
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            window.setTimeout(() => addButtonRef.current?.focus(), 0);
          }
        }}
        onCreate={async (payload) => {
          addEvent({ id: createEventId(), ...payload });
          toast.success('Event created', 'Your event is now visible on the homepage.');
        }}
      />

      <EditEventModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditEventId(null);
        }}
        event={editingEvent}
        onSave={async (payload) => {
          if (!editEventId) return;
          updateEvent(editEventId, payload);
          toast.success('Event updated');
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteEventId)}
        onOpenChange={(open) => {
          if (!open) setDeleteEventId(null);
        }}
        itemLabel={deletingEvent?.name ?? 'this event'}
        onConfirm={() => {
          if (!deleteEventId) return;
          deleteEvent(deleteEventId);
          setDeleteEventId(null);
          toast.success('Event deleted');
        }}
      />
    </div>
  );
}

function statusPill(status: EventStatus) {
  if (status === 'Scheduled') return 'bg-sky-100 text-navy';
  if (status === 'Planned') return 'bg-slate-200 text-slate-700';
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
  return 'bg-red-100 text-red-700';
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  onSort,
  children,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  onSort: (key: SortKey) => void;
  children?: React.ReactNode;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th className="px-6 py-0 text-xs font-bold uppercase tracking-wider text-slate-500">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex h-11 w-full items-center justify-between gap-2 py-3 text-left transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2',
          isActive && 'text-slate-700'
        )}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span className={cn('text-slate-400', isActive && 'text-slate-600')}>{children}</span>
      </button>
    </th>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-semibold text-red-700">{message}</p>;
}

function InputLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="block text-sm font-semibold text-slate-700">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  );
}

function DatalistInput({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  error,
  onBlur,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="space-y-2">
        <InputLabel label={label} required={required} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          list={id}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
            error
              ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
              : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
          )}
          type="text"
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
      </label>
      <datalist id={id}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <FieldError message={error} />
    </div>
  );
}

function AddEventModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (event: EventForm) => Promise<void> | void;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const smartDefaults = useMemo<EventForm>(
    () => ({
      name: '',
      date: todayIsoDate(),
      time: roundToNextQuarterHour(new Date()),
      location: venues[0] ?? 'Main Sanctuary',
      status: 'Scheduled',
      category: categories[0] ?? 'Service',
      speaker: speakers[0] ?? 'Pastor John',
    }),
    []
  );

  const [form, setForm] = useState<EventForm>(smartDefaults);

  useEffect(() => {
    if (!open) return;
    setTouched({});
    try {
      const raw = localStorage.getItem(addDraftKey);
      if (!raw) {
        setForm(smartDefaults);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<EventForm>;
      setForm({ ...smartDefaults, ...parsed });
    } catch {
      setForm(smartDefaults);
    }
  }, [open, smartDefaults]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      try {
        localStorage.setItem(addDraftKey, JSON.stringify(form));
      } catch {
        return;
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [form, open]);

  const errors = useMemo(() => validate(form), [form]);
  const canSubmit = isEmptyErrors(errors) && !isSubmitting;

  const close = () => {
    onOpenChange(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      date: true,
      time: true,
      location: true,
      status: true,
      category: true,
      speaker: true,
    });
    if (!isEmptyErrors(errors)) return;
    setIsSubmitting(true);

    await new Promise((r) => window.setTimeout(r, 350));
    await onCreate({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      category: form.category?.trim() || undefined,
      speaker: form.speaker?.trim() || undefined,
    });

    try {
      localStorage.removeItem(addDraftKey);
    } catch {
      return;
    }

    setIsSubmitting(false);
    close();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Event"
      description="Create a new event."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Event Name" required />
              <input
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.name && errors.name
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="text"
                required
                autoComplete="off"
              />
            </label>
            <FieldError message={touched.name ? errors.name : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Status" required />
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EventStatus }))}
                onBlur={() => setTouched((t) => ({ ...t, status: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.status && errors.status
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                required
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <FieldError message={touched.status ? errors.status : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Date" required />
              <input
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, date: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.date && errors.date
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="date"
                required
              />
            </label>
            <FieldError message={touched.date ? errors.date : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Time" required />
              <input
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, time: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.time && errors.time
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="time"
                required
              />
            </label>
            <FieldError message={touched.time ? errors.time : undefined} />
          </div>

          <DatalistInput
            id="venue-options"
            label="Venue"
            required
            value={form.location}
            onChange={(value) => setForm((p) => ({ ...p, location: value }))}
            options={venues}
            placeholder="Select venue"
            error={touched.location ? errors.location : undefined}
            onBlur={() => setTouched((t) => ({ ...t, location: true }))}
          />

          <DatalistInput
            id="category-options"
            label="Category"
            value={form.category ?? ''}
            onChange={(value) => setForm((p) => ({ ...p, category: value }))}
            options={categories}
            placeholder="Select category"
          />

          <DatalistInput
            id="speaker-options"
            label="Speaker"
            value={form.speaker ?? ''}
            onChange={(value) => setForm((p) => ({ ...p, speaker: value }))}
            options={speakers}
            placeholder="Select speaker"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-navy/60',
              isSubmitting && 'animate-pulse'
            )}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Saving
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditEventModal({
  open,
  onOpenChange,
  onSave,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Partial<EventItem>) => Promise<void> | void;
  event: EventItem | null;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<EventForm>({
    name: '',
    date: todayIsoDate(),
    time: roundToNextQuarterHour(new Date()),
    location: venues[0] ?? 'Main Sanctuary',
    status: 'Scheduled',
    category: categories[0] ?? 'Service',
    speaker: speakers[0] ?? 'Pastor John',
  });

  useEffect(() => {
    if (!open) return;
    setTouched({});
    if (!event) return;
    setForm({
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      status: event.status,
      category: event.category ?? '',
      speaker: event.speaker ?? '',
    });
  }, [event, open]);

  const errors = useMemo(() => validate(form), [form]);
  const canSubmit = isEmptyErrors(errors) && !isSubmitting;

  const close = () => {
    onOpenChange(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, date: true, time: true, location: true, status: true });
    if (!isEmptyErrors(errors)) return;
    setIsSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 250));

    await onSave({
      name: form.name.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      status: form.status,
      category: form.category?.trim() || undefined,
      speaker: form.speaker?.trim() || undefined,
    });

    setIsSubmitting(false);
    close();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Event"
      description="Update the event details."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Event Name" required />
              <input
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.name && errors.name
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="text"
                required
                autoComplete="off"
              />
            </label>
            <FieldError message={touched.name ? errors.name : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Status" required />
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EventStatus }))}
                onBlur={() => setTouched((t) => ({ ...t, status: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.status && errors.status
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                required
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <FieldError message={touched.status ? errors.status : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Date" required />
              <input
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, date: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.date && errors.date
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="date"
                required
              />
            </label>
            <FieldError message={touched.date ? errors.date : undefined} />
          </div>

          <div className="space-y-2">
            <label className="space-y-2">
              <InputLabel label="Time" required />
              <input
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, time: true }))}
                className={cn(
                  'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-2',
                  touched.time && errors.time
                    ? 'border-red-200 focus:border-red-200 focus:ring-red-200'
                    : 'border-slate-200 focus:border-sea-200 focus:ring-sea-500'
                )}
                type="time"
                required
              />
            </label>
            <FieldError message={touched.time ? errors.time : undefined} />
          </div>

          <DatalistInput
            id="venue-options-edit"
            label="Venue"
            required
            value={form.location}
            onChange={(value) => setForm((p) => ({ ...p, location: value }))}
            options={venues}
            placeholder="Select venue"
            error={touched.location ? errors.location : undefined}
            onBlur={() => setTouched((t) => ({ ...t, location: true }))}
          />

          <DatalistInput
            id="category-options-edit"
            label="Category"
            value={form.category ?? ''}
            onChange={(value) => setForm((p) => ({ ...p, category: value }))}
            options={categories}
            placeholder="Select category"
          />

          <DatalistInput
            id="speaker-options-edit"
            label="Speaker"
            value={form.speaker ?? ''}
            onChange={(value) => setForm((p) => ({ ...p, speaker: value }))}
            options={speakers}
            placeholder="Select speaker"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-navy/60',
              isSubmitting && 'animate-pulse'
            )}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Saving
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  itemLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemLabel: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete event"
      description="This action cannot be undone."
      className="max-w-lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-700">
          Are you sure you want to delete <span className="font-semibold">{itemLabel}</span>?
        </p>
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
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-500 focus-visible:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
