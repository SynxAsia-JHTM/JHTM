import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type EventStatus = 'Scheduled' | 'Planned' | 'Completed' | 'Cancelled';

type EventItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
};

const defaultEvents: EventItem[] = [
  {
    id: 'e1',
    name: 'Sunday Worship Service',
    date: '2026-03-22',
    time: '10:00',
    location: 'Main Sanctuary',
    status: 'Scheduled',
  },
  {
    id: 'e2',
    name: 'Mid-week Prayer Meeting',
    date: '2026-03-25',
    time: '19:30',
    location: 'Chapel',
    status: 'Scheduled',
  },
  {
    id: 'e3',
    name: 'Youth Outreach Night',
    date: '2026-03-27',
    time: '18:00',
    location: 'Community Hall',
    status: 'Planned',
  },
  {
    id: 'e4',
    name: 'Leadership Training',
    date: '2026-04-02',
    time: '17:30',
    location: 'Conference Room',
    status: 'Planned',
  },
  {
    id: 'e5',
    name: 'Choir Rehearsal',
    date: '2026-04-04',
    time: '19:00',
    location: 'Music Room',
    status: 'Scheduled',
  },
];

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Pick<EventItem, 'name' | 'date' | 'time' | 'location' | 'status'>;

const eventStorageKey = 'jhtm.events.v1';

function loadEvents(): EventItem[] {
  try {
    const raw = localStorage.getItem(eventStorageKey);
    if (!raw) return defaultEvents;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultEvents;
    return parsed as EventItem[];
  } catch {
    return defaultEvents;
  }
}

function saveEvents(events: EventItem[]) {
  try {
    localStorage.setItem(eventStorageKey, JSON.stringify(events));
  } catch {
    return;
  }
}

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function createEventId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `e_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>(() => loadEvents());
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const persistEvents = (next: EventItem[]) => {
    setEvents(next);
    saveEvents(next);
  };

  const onEventAdded = (event: Omit<EventItem, 'id'>) => {
    const next = [{ id: createEventId(), ...event }, ...events];
    persistEvents(next);
  };

  const onEventEdited = (id: string, updates: Omit<EventItem, 'id'>) => {
    const next = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    persistEvents(next);
  };

  const onEventDeleted = (id: string) => {
    const next = events.filter((e) => e.id !== id);
    persistEvents(next);
  };

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
          const haystack = [e.name, e.date, e.time, e.location, e.status].join(' ').toLowerCase();
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
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
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', statusPill(e.status))}>
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
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          aria-label={`Edit ${e.name}`}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEventId(e.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
        onSave={(payload) => {
          onEventAdded(payload);
          setIsAddOpen(false);
        }}
      />

      <EditEventModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditEventId(null);
        }}
        event={editingEvent}
        onSave={(updates) => {
          if (!editEventId) return;
          onEventEdited(editEventId, updates);
          setIsEditOpen(false);
          setEditEventId(null);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteEventId)}
        onOpenChange={(open) => {
          if (!open) setDeleteEventId(null);
        }}
        title="Delete event"
        description="This action cannot be undone."
        itemLabel={deletingEvent?.name ?? 'this event'}
        onConfirm={() => {
          if (!deleteEventId) return;
          onEventDeleted(deleteEventId);
          setDeleteEventId(null);
        }}
      />
    </div>
  );
}

function statusPill(status: EventStatus) {
  if (status === 'Scheduled') return 'bg-blue-100 text-blue-700';
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
          'inline-flex h-11 w-full items-center justify-between gap-2 py-3 text-left transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
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

function InputField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function AddEventModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<EventItem, 'id'>) => void;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<EventItem, 'id'>>({
    name: '',
    date: '',
    time: '',
    location: '',
    status: 'Scheduled',
  });

  const reset = () => {
    setError(null);
    setForm({ name: '', date: '', time: '', location: '', status: 'Scheduled' });
  };

  const close = () => {
    onOpenChange(false);
    window.setTimeout(() => reset(), 0);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Event name is required.');
      nameRef.current?.focus();
      return;
    }
    if (!form.date.trim()) {
      setError('Date is required.');
      return;
    }
    if (!form.time.trim()) {
      setError('Time is required.');
      return;
    }
    if (!form.location.trim()) {
      setError('Location is required.');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
      title="Add Event"
      description="Create a new event."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Event Name" required>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="text"
              required
              autoComplete="off"
            />
          </InputField>

          <InputField label="Status" required>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </InputField>

          <InputField label="Date" required>
            <input
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="date"
              required
            />
          </InputField>

          <InputField label="Time" required>
            <input
              value={form.time}
              onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="time"
              required
            />
          </InputField>

          <div className="sm:col-span-2">
            <InputField label="Location" required>
              <input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
                type="text"
                required
                autoComplete="off"
              />
            </InputField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Save
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
  onSave: (event: Omit<EventItem, 'id'>) => void;
  event: EventItem | null;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<EventItem, 'id'>>({
    name: '',
    date: '',
    time: '',
    location: '',
    status: 'Scheduled',
  });

  useEffect(() => {
    if (!open) return;
    if (!event) return;
    setError(null);
    setForm({
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      status: event.status,
    });
  }, [event, open]);

  const close = () => {
    setError(null);
    onOpenChange(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Event name is required.');
      nameRef.current?.focus();
      return;
    }
    if (!form.date.trim()) {
      setError('Date is required.');
      return;
    }
    if (!form.time.trim()) {
      setError('Time is required.');
      return;
    }
    if (!form.location.trim()) {
      setError('Location is required.');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
      title="Edit Event"
      description="Update the event details."
      initialFocusRef={nameRef}
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Event Name" required>
            <input
              ref={nameRef}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="text"
              required
              autoComplete="off"
            />
          </InputField>

          <InputField label="Status" required>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </InputField>

          <InputField label="Date" required>
            <input
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="date"
              required
            />
          </InputField>

          <InputField label="Time" required>
            <input
              value={form.time}
              onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
              type="time"
              required
            />
          </InputField>

          <div className="sm:col-span-2">
            <InputField label="Location" required>
              <input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-600"
                type="text"
                required
                autoComplete="off"
              />
            </InputField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Save
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
  title,
  description,
  itemLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemLabel: string;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} className="max-w-lg">
      <div className="space-y-5">
        <p className="text-sm text-slate-700">
          Are you sure you want to delete <span className="font-semibold">{itemLabel}</span>?
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
