import { create } from 'zustand';

import { apiRequest } from '@/lib/apiClient';

export type MemberProfile = {
  id: string;
  user_id: number;
  name: string;
  email: string;
  phone?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  category?: 'Youth' | 'Pastor' | 'Leader' | 'Member' | 'Guest' | null;
  birthdate?: string | null;
  ministry?: string | null;
  status?: 'Active' | 'Pending' | 'Inactive';
  created_at?: string | null;
  updated_at?: string | null;
};

type MembersState = {
  me: MemberProfile | null;
  members: MemberProfile[];
  hasLoadedMe: boolean;
  hasLoadedMembers: boolean;
  isLoadingMe: boolean;
  isLoadingMembers: boolean;
  error: string | null;
  loadMe: (opts?: { force?: boolean }) => Promise<void>;
  updateMe: (updates: Partial<MemberProfile>) => Promise<boolean>;
  loadMembers: (opts?: { force?: boolean }) => Promise<void>;
};

export const useMembersStore = create<MembersState>((set, get) => ({
  me: null,
  members: [],
  hasLoadedMe: false,
  hasLoadedMembers: false,
  isLoadingMe: false,
  isLoadingMembers: false,
  error: null,

  loadMe: async (opts) => {
    if (get().hasLoadedMe && !opts?.force) return;
    if (get().isLoadingMe) return;
    set({ isLoadingMe: true, error: null });

    const res = await apiRequest<MemberProfile>('/api/members/me/');
    if (res.ok === false) {
      set({ hasLoadedMe: true, isLoadingMe: false, me: null, error: res.detail });
      return;
    }

    set({ hasLoadedMe: true, isLoadingMe: false, me: res.data, error: null });
  },

  updateMe: async (updates) => {
    const me = get().me;
    if (!me) {
      await get().loadMe({ force: true });
    }
    const current = get().me;
    if (!current) return false;

    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.email !== undefined) body.email = updates.email;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.gender !== undefined) body.gender = updates.gender;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.birthdate !== undefined) body.birthdate = updates.birthdate;
    if (updates.ministry !== undefined) body.ministry = updates.ministry;

    const res = await apiRequest<MemberProfile>(`/api/members/${current.id}/`, {
      method: 'PATCH',
      body,
    });
    if (res.ok === false) {
      set({ error: res.detail });
      return false;
    }

    set({ me: res.data, error: null });
    return true;
  },

  loadMembers: async (opts) => {
    if (get().hasLoadedMembers && !opts?.force) return;
    if (get().isLoadingMembers) return;
    set({ isLoadingMembers: true, error: null });

    const res = await apiRequest<{ results: MemberProfile[] }>('/api/members/');
    if (res.ok === false) {
      set({ hasLoadedMembers: true, isLoadingMembers: false, members: [], error: res.detail });
      return;
    }

    set({
      hasLoadedMembers: true,
      isLoadingMembers: false,
      members: res.data.results ?? [],
      error: null,
    });
  },
}));
