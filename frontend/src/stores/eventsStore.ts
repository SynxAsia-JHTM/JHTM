import { create } from 'zustand';

export type EventStatus = 'Scheduled' | 'Planned' | 'Completed' | 'Cancelled';

export type EventItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
  category?: string;
  speaker?: string;
};

type EventsState = {
  events: EventItem[];
  setEvents: (events: EventItem[]) => void;
  replaceEventsFromSync: (events: EventItem[]) => void;
  addEvent: (event: EventItem) => void;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
};

const storageKey = 'jhtm.events.v1';
const channelName = 'jhtm.events.channel.v1';

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

function safeParseEvents(raw: string | null): EventItem[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as EventItem[];
  } catch {
    return null;
  }
}

function loadInitialEvents(): EventItem[] {
  if (typeof window === 'undefined') return defaultEvents;
  const parsed = safeParseEvents(window.localStorage.getItem(storageKey));
  return parsed ?? defaultEvents;
}

function persist(events: EventItem[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch {
    return;
  }
}

function createChannel() {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;
  return new BroadcastChannel(channelName);
}

const channel = createChannel();

function broadcast(events: EventItem[]) {
  channel?.postMessage({ type: 'events:update', events });
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: loadInitialEvents(),
  setEvents: (events) => {
    set({ events });
    if (typeof window !== 'undefined') {
      persist(events);
      broadcast(events);
    }
  },
  replaceEventsFromSync: (events) => {
    set({ events });
  },
  addEvent: (event) => {
    const next = [event, ...get().events];
    set({ events: next });
    persist(next);
    broadcast(next);
  },
  updateEvent: (id, updates) => {
    const next = get().events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    set({ events: next });
    persist(next);
    broadcast(next);
  },
  deleteEvent: (id) => {
    const next = get().events.filter((e) => e.id !== id);
    set({ events: next });
    persist(next);
    broadcast(next);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== storageKey) return;
    const parsed = safeParseEvents(e.newValue);
    if (!parsed) return;
    useEventsStore.getState().replaceEventsFromSync(parsed);
  });

  channel?.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; events?: EventItem[] } | null;
    if (data?.type !== 'events:update') return;
    if (!Array.isArray(data.events)) return;
    useEventsStore.getState().replaceEventsFromSync(data.events);
  });
}

export function createEventId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `e_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
