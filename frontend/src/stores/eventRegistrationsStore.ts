import { create } from 'zustand';

export type EventRegistration = {
  id: string;
  eventId: string;
  memberId: string;
  createdAt: string;
};

type EventRegistrationsState = {
  registrations: EventRegistration[];
  joinEvent: (payload: { eventId: string; memberId: string }) => boolean;
  leaveEvent: (payload: { eventId: string; memberId: string }) => void;
  isJoined: (payload: { eventId: string; memberId: string }) => boolean;
  countForEvent: (eventId: string) => number;
};

const storageKey = 'jhtm.eventRegistrations.v1';
const channelName = 'jhtm.eventRegistrations.channel.v1';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadInitial(): EventRegistration[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<EventRegistration[]>(window.localStorage.getItem(storageKey));
  return Array.isArray(parsed) ? parsed : [];
}

function persist(registrations: EventRegistration[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(registrations));
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

function broadcast(registrations: EventRegistration[]) {
  channel?.postMessage({ type: 'eventRegistrations:update', registrations });
}

function createId(eventId: string, memberId: string) {
  return `reg:${eventId}:${memberId}`;
}

export const useEventRegistrationsStore = create<EventRegistrationsState>((set, get) => ({
  registrations: loadInitial(),
  joinEvent: ({ eventId, memberId }) => {
    const already = get().registrations.some(
      (r) => r.eventId === eventId && r.memberId === memberId
    );
    if (already) return false;

    const next = [
      {
        id: createId(eventId, memberId),
        eventId,
        memberId,
        createdAt: new Date().toISOString(),
      },
      ...get().registrations,
    ];
    set({ registrations: next });
    if (typeof window !== 'undefined') {
      persist(next);
      broadcast(next);
    }
    return true;
  },
  leaveEvent: ({ eventId, memberId }) => {
    const next = get().registrations.filter(
      (r) => !(r.eventId === eventId && r.memberId === memberId)
    );
    set({ registrations: next });
    if (typeof window !== 'undefined') {
      persist(next);
      broadcast(next);
    }
  },
  isJoined: ({ eventId, memberId }) => {
    return get().registrations.some((r) => r.eventId === eventId && r.memberId === memberId);
  },
  countForEvent: (eventId) => {
    return get().registrations.filter((r) => r.eventId === eventId).length;
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== storageKey) return;
    const next = safeParse<EventRegistration[]>(e.newValue);
    if (!Array.isArray(next)) return;
    useEventRegistrationsStore.setState({ registrations: next });
  });

  channel?.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; registrations?: EventRegistration[] } | null;
    if (data?.type !== 'eventRegistrations:update') return;
    if (!Array.isArray(data.registrations)) return;
    useEventRegistrationsStore.setState({ registrations: data.registrations });
  });
}
