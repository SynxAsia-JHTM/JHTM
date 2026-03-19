import { create } from 'zustand';

export type AttendanceStatus = 'present' | 'expected' | 'late' | 'excused' | 'removed';
export type CheckinMethod = 'manual' | 'qr';

export type GuestProfile = {
  fullName: string;
  phone?: string;
  email?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  attendeeType: 'member' | 'guest';
  memberId?: string;
  guest?: GuestProfile;
  status: AttendanceStatus;
  checkinMethod: CheckinMethod;
  checkedInAt: string;
  checkedInBy?: 'admin' | 'self';
  notes?: string;
};

export type CheckinTokenScope = 'service' | 'member';

export type CheckinToken = {
  id: string;
  eventId: string;
  scope: CheckinTokenScope;
  memberId?: string;
  expiresAt: string;
  usedAt?: string;
};

type AttendanceState = {
  records: AttendanceRecord[];
  tokens: CheckinToken[];
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  removeRecord: (id: string) => void;
  upsertRecord: (record: AttendanceRecord) => void;
  createToken: (token: CheckinToken) => void;
  markTokenUsed: (id: string) => void;
};

const recordsKey = 'jhtm.attendance.v1';
const tokensKey = 'jhtm.checkinTokens.v1';
const channelName = 'jhtm.attendance.channel.v1';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadInitialRecords(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<AttendanceRecord[]>(window.localStorage.getItem(recordsKey));
  return Array.isArray(parsed) ? parsed : [];
}

function loadInitialTokens(): CheckinToken[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<CheckinToken[]>(window.localStorage.getItem(tokensKey));
  return Array.isArray(parsed) ? parsed : [];
}

function persist(records: AttendanceRecord[], tokens: CheckinToken[]) {
  try {
    window.localStorage.setItem(recordsKey, JSON.stringify(records));
    window.localStorage.setItem(tokensKey, JSON.stringify(tokens));
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

function broadcast(payload: { records: AttendanceRecord[]; tokens: CheckinToken[] }) {
  channel?.postMessage({ type: 'attendance:update', ...payload });
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: loadInitialRecords(),
  tokens: loadInitialTokens(),
  addRecord: (record) => {
    const nextRecords = [record, ...get().records];
    const tokens = get().tokens;
    set({ records: nextRecords });
    if (typeof window !== 'undefined') {
      persist(nextRecords, tokens);
      broadcast({ records: nextRecords, tokens });
    }
  },
  upsertRecord: (record) => {
    const existing = get().records.find((r) => r.id === record.id);
    const nextRecords = existing
      ? get().records.map((r) => (r.id === record.id ? record : r))
      : [record, ...get().records];
    const tokens = get().tokens;
    set({ records: nextRecords });
    if (typeof window !== 'undefined') {
      persist(nextRecords, tokens);
      broadcast({ records: nextRecords, tokens });
    }
  },
  updateRecord: (id, updates) => {
    const nextRecords = get().records.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const tokens = get().tokens;
    set({ records: nextRecords });
    if (typeof window !== 'undefined') {
      persist(nextRecords, tokens);
      broadcast({ records: nextRecords, tokens });
    }
  },
  removeRecord: (id) => {
    const nextRecords = get().records.filter((r) => r.id !== id);
    const tokens = get().tokens;
    set({ records: nextRecords });
    if (typeof window !== 'undefined') {
      persist(nextRecords, tokens);
      broadcast({ records: nextRecords, tokens });
    }
  },
  createToken: (token) => {
    const nextTokens = [token, ...get().tokens];
    const records = get().records;
    set({ tokens: nextTokens });
    if (typeof window !== 'undefined') {
      persist(records, nextTokens);
      broadcast({ records, tokens: nextTokens });
    }
  },
  markTokenUsed: (id) => {
    const nextTokens = get().tokens.map((t) =>
      t.id === id ? { ...t, usedAt: new Date().toISOString() } : t
    );
    const records = get().records;
    set({ tokens: nextTokens });
    if (typeof window !== 'undefined') {
      persist(records, nextTokens);
      broadcast({ records, tokens: nextTokens });
    }
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== recordsKey && e.key !== tokensKey) return;
    const nextRecords = safeParse<AttendanceRecord[]>(window.localStorage.getItem(recordsKey));
    const nextTokens = safeParse<CheckinToken[]>(window.localStorage.getItem(tokensKey));
    useAttendanceStore.setState({
      records: Array.isArray(nextRecords) ? nextRecords : [],
      tokens: Array.isArray(nextTokens) ? nextTokens : [],
    });
  });

  channel?.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      records?: AttendanceRecord[];
      tokens?: CheckinToken[];
    } | null;
    if (data?.type !== 'attendance:update') return;
    useAttendanceStore.setState({
      records: Array.isArray(data.records) ? data.records : [],
      tokens: Array.isArray(data.tokens) ? data.tokens : [],
    });
  });
}

export function createAttendanceId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `att_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createTokenId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
