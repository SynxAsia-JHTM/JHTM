import { create } from 'zustand';

import { apiRequest } from '@/lib/apiClient';

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
  memberId?: string | null;
  memberName?: string | null;
  guest?: GuestProfile | null;
  status: AttendanceStatus;
  checkinMethod: CheckinMethod;
  checkedInAt: string;
  notes?: string | null;
};

export type CheckinToken = {
  id: string;
  eventId: string;
  scope: 'service' | 'member';
  expiresAt: string;
  usedAt?: string | null;
  event?: { id: string; name: string; date: string; time: string; location: string };
};

type AttendanceState = {
  records: AttendanceRecord[];
  myRecords: AttendanceRecord[];
  isLoadingAdmin: boolean;
  isLoadingMine: boolean;
  error: string | null;
  loadAdmin: (opts?: { eventId?: string; force?: boolean }) => Promise<void>;
  loadMine: (opts?: { force?: boolean }) => Promise<void>;
  selfAttend: (payload: {
    eventId: string;
    status: 'expected' | 'present' | 'late';
  }) => Promise<boolean>;
  adminUpsert: (payload: {
    eventId: string;
    attendeeType: 'member' | 'guest';
    memberId?: string;
    guest?: GuestProfile;
    status: AttendanceStatus;
    checkinMethod: CheckinMethod;
    notes?: string;
  }) => Promise<boolean>;
  adminUpdate: (
    id: string,
    updates: Partial<Pick<AttendanceRecord, 'status' | 'checkinMethod' | 'notes'>>
  ) => Promise<boolean>;
  adminRemove: (id: string) => Promise<boolean>;
  createServiceToken: (
    eventId: string,
    expiresInMinutes?: number
  ) => Promise<{
    tokenId: string;
    expiresAt: string;
    url: string;
  } | null>;
  fetchToken: (tokenId: string) => Promise<CheckinToken | null>;
  submitQrGuest: (payload: {
    tokenId: string;
    guestFullName: string;
    guestPhone?: string;
    guestEmail?: string;
  }) => Promise<boolean>;
  submitGuest: (payload: {
    eventId: string;
    guestFullName: string;
    guestPhone?: string;
    guestEmail?: string;
  }) => Promise<boolean>;
};

type AttendanceApiItem = {
  id: string;
  event_id: string;
  attendee_type: 'member' | 'guest';
  member_id?: string | null;
  member_name?: string | null;
  guest?: { full_name: string; phone?: string | null; email?: string | null } | null;
  status: AttendanceStatus;
  checkin_method: CheckinMethod;
  checked_in_at: string;
  notes?: string | null;
};

function mapRecord(r: AttendanceApiItem): AttendanceRecord {
  return {
    id: r.id,
    eventId: r.event_id,
    attendeeType: r.attendee_type,
    memberId: r.member_id ?? null,
    memberName: r.member_name ?? null,
    guest: r.guest
      ? {
          fullName: r.guest.full_name,
          phone: r.guest.phone ?? undefined,
          email: r.guest.email ?? undefined,
        }
      : null,
    status: r.status,
    checkinMethod: r.checkin_method,
    checkedInAt: r.checked_in_at,
    notes: r.notes ?? null,
  };
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  myRecords: [],
  isLoadingAdmin: false,
  isLoadingMine: false,
  error: null,

  loadAdmin: async (opts) => {
    if (get().isLoadingAdmin) return;
    set({ isLoadingAdmin: true, error: null });
    const qs = opts?.eventId ? `?event_id=${encodeURIComponent(opts.eventId)}` : '';
    const res = await apiRequest<{ results: AttendanceApiItem[] }>(`/api/attendance/${qs}`);
    if (res.ok === false) {
      set({ isLoadingAdmin: false, error: res.detail, records: [] });
      return;
    }
    set({ isLoadingAdmin: false, error: null, records: (res.data.results ?? []).map(mapRecord) });
  },

  loadMine: async () => {
    if (get().isLoadingMine) return;
    set({ isLoadingMine: true, error: null });
    const res = await apiRequest<{ results: AttendanceApiItem[] }>('/api/attendance/me/');
    if (res.ok === false) {
      set({ isLoadingMine: false, error: res.detail, myRecords: [] });
      return;
    }
    set({ isLoadingMine: false, error: null, myRecords: (res.data.results ?? []).map(mapRecord) });
  },

  selfAttend: async ({ eventId, status }) => {
    const prev = get().myRecords;
    const optimistic: AttendanceRecord = {
      id: `local_${eventId}`,
      eventId,
      attendeeType: 'member',
      memberId: null,
      memberName: null,
      guest: null,
      status,
      checkinMethod: 'manual',
      checkedInAt: new Date().toISOString(),
      notes: null,
    };
    set({ myRecords: [optimistic, ...get().myRecords.filter((r) => r.id !== optimistic.id)] });

    const res = await apiRequest<{ id: string }>('/api/attendance/', {
      method: 'POST',
      body: { event_id: eventId, status, checkin_method: 'manual' },
    });
    if (res.ok === false) {
      set({ error: res.detail, myRecords: prev });
      return false;
    }

    await get().loadMine();
    return true;
  },

  adminUpsert: async (payload) => {
    const body: Record<string, unknown> = {
      event_id: payload.eventId,
      attendee_type: payload.attendeeType,
      status: payload.status,
      checkin_method: payload.checkinMethod,
      notes: payload.notes,
    };
    if (payload.attendeeType === 'member') body.member_id = payload.memberId;
    if (payload.attendeeType === 'guest') {
      body.guest_full_name = payload.guest?.fullName;
      body.guest_phone = payload.guest?.phone;
      body.guest_email = payload.guest?.email;
    }

    const res = await apiRequest<{ id: string }>('/api/attendance/', { method: 'POST', body });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }

    await get().loadAdmin({ eventId: payload.eventId });
    return true;
  },

  adminUpdate: async (id, updates) => {
    const body: Record<string, unknown> = {};
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.checkinMethod !== undefined) body.checkin_method = updates.checkinMethod;
    if (updates.notes !== undefined) body.notes = updates.notes;

    const res = await apiRequest<{ id: string }>(`/api/attendance/${id}/`, {
      method: 'PATCH',
      body,
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }

    set({
      records: get().records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      myRecords: get().myRecords.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    });
    return true;
  },

  adminRemove: async (id) => {
    const res = await apiRequest<{ id: string }>(`/api/attendance/${id}/`, {
      method: 'PATCH',
      body: { status: 'removed' },
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }
    set({ records: get().records.filter((r) => r.id !== id) });
    return true;
  },

  createServiceToken: async (eventId, expiresInMinutes) => {
    const res = await apiRequest<{ id: string; expires_at: string }>('/api/attendance/tokens/', {
      method: 'POST',
      body: { event_id: eventId, expires_in_minutes: expiresInMinutes ?? 10 },
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return null;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      tokenId: res.data.id,
      expiresAt: res.data.expires_at,
      url: `${origin}/checkin/${res.data.id}`,
    };
  },

  fetchToken: async (tokenId) => {
    const res = await apiRequest<{
      id: string;
      event_id: string;
      scope: 'service' | 'member';
      expires_at: string;
      used_at?: string | null;
      event: { id: string; name: string; date: string; time: string; location: string };
    }>(`/api/attendance/tokens/${tokenId}/`, { token: null });
    if (!res.ok) {
      return null;
    }
    return {
      id: res.data.id,
      eventId: res.data.event_id,
      scope: res.data.scope,
      expiresAt: res.data.expires_at,
      usedAt: res.data.used_at ?? null,
      event: res.data.event,
    };
  },

  submitQrGuest: async ({ tokenId, guestFullName, guestPhone, guestEmail }) => {
    const res = await apiRequest<{ id: string }>('/api/attendance/qr/', {
      method: 'POST',
      token: null,
      body: {
        token_id: tokenId,
        attendee_type: 'guest',
        guest_full_name: guestFullName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
      },
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }
    return true;
  },

  submitGuest: async ({ eventId, guestFullName, guestPhone, guestEmail }) => {
    const res = await apiRequest<{ id: string }>('/api/attendance/guest/', {
      method: 'POST',
      token: null,
      body: {
        event_id: eventId,
        attendee_type: 'guest',
        guest_full_name: guestFullName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
      },
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }
    return true;
  },
}));
