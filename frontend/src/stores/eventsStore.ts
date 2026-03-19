import { create } from 'zustand';

import { apiRequest } from '@/lib/apiClient';

export type EventStatus = 'Scheduled' | 'Planned' | 'Completed' | 'Cancelled';

export type EventItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
  category?: string | null;
  speaker?: string | null;
  requiresRegistration?: boolean;
  maxSlots?: number | null;
  registrationsCount?: number;
  remainingSlots?: number | null;
  isRegistered?: boolean;
};

type EventsState = {
  events: EventItem[];
  hasLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadEvents: (opts?: { force?: boolean }) => Promise<void>;
  createEvent: (payload: Omit<EventItem, 'id'>) => Promise<string | null>;
  updateEvent: (id: string, updates: Partial<EventItem>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  registerForEvent: (eventId: string) => Promise<boolean>;
  leaveEvent: (eventId: string) => Promise<boolean>;
};

type EventsApiItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
  category?: string | null;
  speaker?: string | null;
  requires_registration?: boolean;
  max_slots?: number | null;
  registrations_count?: number;
  remaining_slots?: number | null;
  is_registered?: boolean;
};

function mapEvent(e: EventsApiItem): EventItem {
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    time: e.time,
    location: e.location,
    status: e.status,
    category: e.category ?? null,
    speaker: e.speaker ?? null,
    requiresRegistration: Boolean(e.requires_registration),
    maxSlots: e.max_slots ?? null,
    registrationsCount: e.registrations_count ?? 0,
    remainingSlots: e.remaining_slots ?? null,
    isRegistered: Boolean(e.is_registered),
  };
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  hasLoaded: false,
  isLoading: false,
  error: null,

  loadEvents: async (opts) => {
    if (get().hasLoaded && !opts?.force) return;
    if (get().isLoading) return;
    set({ isLoading: true, error: null });

    const res = await apiRequest<{ results: EventsApiItem[] }>('/api/events/');
    if (res.ok === false) {
      set({ hasLoaded: true, isLoading: false, error: res.detail, events: [] });
      return;
    }

    set({
      hasLoaded: true,
      isLoading: false,
      error: null,
      events: (res.data.results ?? []).map(mapEvent),
    });
  },

  createEvent: async (payload) => {
    const body = {
      name: payload.name,
      date: payload.date,
      time: payload.time,
      location: payload.location,
      status: payload.status,
      category: payload.category ?? null,
      speaker: payload.speaker ?? null,
      requires_registration: Boolean(payload.requiresRegistration),
      max_slots: payload.maxSlots ?? null,
    };

    const res = await apiRequest<{ id: string }>('/api/events/', { method: 'POST', body });
    if (res.ok === false) {
      set({ error: res.detail });
      return null;
    }

    await get().loadEvents({ force: true });
    return res.data.id;
  },

  updateEvent: async (id, updates) => {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.date !== undefined) body.date = updates.date;
    if (updates.time !== undefined) body.time = updates.time;
    if (updates.location !== undefined) body.location = updates.location;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.speaker !== undefined) body.speaker = updates.speaker;
    if (updates.requiresRegistration !== undefined)
      body.requires_registration = Boolean(updates.requiresRegistration);
    if (updates.maxSlots !== undefined) body.max_slots = updates.maxSlots;

    const res = await apiRequest<{ id: string }>(`/api/events/${id}/`, { method: 'PATCH', body });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }

    await get().loadEvents({ force: true });
    return true;
  },

  deleteEvent: async (id) => {
    const res = await apiRequest<unknown>(`/api/events/${id}/`, { method: 'DELETE' });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }

    set({ events: get().events.filter((e) => e.id !== id) });
    return true;
  },

  registerForEvent: async (eventId) => {
    const res = await apiRequest<{ ok: boolean }>(`/api/events/${eventId}/register/`, {
      method: 'POST',
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }
    await get().loadEvents({ force: true });
    return true;
  },

  leaveEvent: async (eventId) => {
    const res = await apiRequest<unknown>(`/api/events/${eventId}/register/`, { method: 'DELETE' });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }
    await get().loadEvents({ force: true });
    return true;
  },
}));
