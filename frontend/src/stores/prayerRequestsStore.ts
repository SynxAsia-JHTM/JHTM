import { create } from 'zustand';

import { getApiBaseUrl } from '@/lib/config';

export type PrayerVisibility = 'private' | 'leaders' | 'public';
export type PrayerStatus = 'Submitted';

export type PrayerRequest = {
  id: string;
  userId: number;
  message: string;
  visibility: PrayerVisibility;
  isAnonymous: boolean;
  status: PrayerStatus;
  createdAt: string;
  synced?: boolean;
};

export type AdminPrayerRequest = PrayerRequest & {
  userEmail?: string | null;
};

type PrayerRequestsState = {
  myRequests: PrayerRequest[];
  adminRequests: AdminPrayerRequest[];
  hasLoadedMy: boolean;
  hasLoadedAdmin: boolean;
  setMyRequests: (requests: PrayerRequest[]) => void;
  replaceMyRequestsFromSync: (requests: PrayerRequest[]) => void;
  submitMyRequest: (payload: {
    message: string;
    visibility: PrayerVisibility;
    isAnonymous: boolean;
  }) => Promise<PrayerRequest>;
  loadMyRequests: (opts?: { force?: boolean }) => Promise<void>;
  loadAdminRequests: (opts?: { force?: boolean }) => Promise<void>;
};

const storageKey = 'jhtm.prayerRequests.my.v1';
const channelName = 'jhtm.prayerRequests.channel.v1';

function safeParseRequests(raw: string | null): PrayerRequest[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as PrayerRequest[];
  } catch {
    return null;
  }
}

function loadInitial(): PrayerRequest[] {
  if (typeof window === 'undefined') return [];
  return safeParseRequests(window.localStorage.getItem(storageKey)) ?? [];
}

function persist(requests: PrayerRequest[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(requests));
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

function broadcastMyRequests(requests: PrayerRequest[]) {
  channel?.postMessage({ type: 'prayers:my:update', requests });
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
}

function getCurrentUserId(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { id?: number };
    return typeof parsed.id === 'number' ? parsed.id : 0;
  } catch {
    return 0;
  }
}

function createLocalId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `pr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export const usePrayerRequestsStore = create<PrayerRequestsState>((set, get) => ({
  myRequests: loadInitial(),
  adminRequests: [],
  hasLoadedMy: false,
  hasLoadedAdmin: false,
  setMyRequests: (requests) => {
    set({ myRequests: requests });
    if (typeof window !== 'undefined') {
      persist(requests);
      broadcastMyRequests(requests);
    }
  },
  replaceMyRequestsFromSync: (requests) => {
    set({ myRequests: requests });
  },
  submitMyRequest: async ({ message, visibility, isAnonymous }) => {
    const userId = getCurrentUserId();
    const optimistic: PrayerRequest = {
      id: `local_${createLocalId()}`,
      userId,
      message: message.trim(),
      visibility,
      isAnonymous,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      synced: false,
    };

    const next = [optimistic, ...get().myRequests];
    set({ myRequests: next });
    persist(next);
    broadcastMyRequests(next);

    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) {
      return optimistic;
    }

    const response = await fetch(`${apiBase}/api/prayer-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: message.trim(), visibility, is_anonymous: isAnonymous }),
    });

    if (!response.ok) {
      return optimistic;
    }

    const data = (await response.json()) as {
      id: string;
      user_id: number;
      message: string;
      visibility: PrayerVisibility;
      is_anonymous: boolean;
      status: PrayerStatus;
      created_at: string;
    };

    const synced: PrayerRequest = {
      id: data.id,
      userId: data.user_id,
      message: data.message,
      visibility: data.visibility,
      isAnonymous: data.is_anonymous,
      status: data.status,
      createdAt: data.created_at,
      synced: true,
    };

    const replaced = get().myRequests.map((r) => (r.id === optimistic.id ? synced : r));
    const deduped = dedupeById(replaced);
    set({ myRequests: deduped });
    persist(deduped);
    broadcastMyRequests(deduped);
    return synced;
  },
  loadMyRequests: async (opts) => {
    if (get().hasLoadedMy && !opts?.force) return;
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) {
      set({ hasLoadedMy: true });
      return;
    }

    const response = await fetch(`${apiBase}/api/prayer-requests/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      set({ hasLoadedMy: true });
      return;
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string;
        user_id: number;
        message: string;
        visibility: PrayerVisibility;
        is_anonymous: boolean;
        status: PrayerStatus;
        created_at: string;
      }>;
    };

    const mapped: PrayerRequest[] = (data.results ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      message: r.message,
      visibility: r.visibility,
      isAnonymous: r.is_anonymous,
      status: r.status,
      createdAt: r.created_at,
      synced: true,
    }));

    set({ myRequests: mapped, hasLoadedMy: true });
    persist(mapped);
    broadcastMyRequests(mapped);
  },
  loadAdminRequests: async (opts) => {
    if (get().hasLoadedAdmin && !opts?.force) return;
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) {
      set({ hasLoadedAdmin: true, adminRequests: [] });
      return;
    }

    const response = await fetch(`${apiBase}/api/prayer-requests/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      set({ hasLoadedAdmin: true, adminRequests: [] });
      return;
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string;
        user_id: number;
        user_email?: string | null;
        message: string;
        visibility: PrayerVisibility;
        is_anonymous: boolean;
        status: PrayerStatus;
        created_at: string;
      }>;
    };

    const mapped: AdminPrayerRequest[] = (data.results ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email ?? null,
      message: r.message,
      visibility: r.visibility,
      isAnonymous: r.is_anonymous,
      status: r.status,
      createdAt: r.created_at,
      synced: true,
    }));

    set({ adminRequests: mapped, hasLoadedAdmin: true });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== storageKey) return;
    const parsed = safeParseRequests(e.newValue);
    if (!parsed) return;
    usePrayerRequestsStore.getState().replaceMyRequestsFromSync(parsed);
  });

  channel?.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; requests?: PrayerRequest[] } | null;
    if (data?.type !== 'prayers:my:update') return;
    if (!Array.isArray(data.requests)) return;
    usePrayerRequestsStore.getState().replaceMyRequestsFromSync(data.requests);
  });
}
