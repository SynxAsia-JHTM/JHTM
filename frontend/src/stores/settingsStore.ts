import { create } from 'zustand';
import { getApiBaseUrl } from '@/lib/config';

export type SystemSettings = {
  church_name: string;
  church_address: string;
  church_contact: string;
  church_email: string;
  church_logo_url: string | null;
  attendance_enable_qr: boolean;
  attendance_allow_guest: boolean;
  attendance_time_window: number;
  prayer_allow_anonymous: boolean;
  prayer_default_visibility: 'private' | 'leaders' | 'public';
  event_enable_registration: boolean;
  event_default_max_slots: number;
  notification_email_alerts: boolean;
  notification_in_app_alerts: boolean;
  appearance_theme: string;
};

export type UserManagementUser = {
  id: number;
  email: string;
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
};

type SettingsState = {
  settings: SystemSettings | null;
  users: UserManagementUser[];
  hasLoadedSettings: boolean;
  hasLoadedUsers: boolean;
  loadSettings: (opts?: { force?: boolean }) => Promise<void>;
  updateSettings: (payload: Partial<SystemSettings>) => Promise<boolean>;
  loadUsers: (opts?: { force?: boolean }) => Promise<void>;
  createUser: (payload: Partial<UserManagementUser> & { password?: string }) => Promise<boolean>;
  updateUser: (
    id: number,
    payload: Partial<UserManagementUser> & { password?: string }
  ) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
};

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  users: [],
  hasLoadedSettings: false,
  hasLoadedUsers: false,

  loadSettings: async (opts) => {
    if (get().hasLoadedSettings && !opts?.force) return;
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return;

    try {
      const response = await fetch(`${apiBase}/api/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        set({ settings: data, hasLoadedSettings: true });
      }
    } catch {
      // ignore
    }
  },

  updateSettings: async (payload) => {
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return false;

    try {
      const response = await fetch(`${apiBase}/api/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        set({ settings: data });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  loadUsers: async (opts) => {
    if (get().hasLoadedUsers && !opts?.force) return;
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return;

    try {
      const response = await fetch(`${apiBase}/api/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        set({ users: data.results || [], hasLoadedUsers: true });
      }
    } catch {
      // ignore
    }
  },

  createUser: async (payload) => {
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return false;

    try {
      const response = await fetch(`${apiBase}/api/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        set({ users: [data, ...get().users] });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  updateUser: async (id, payload) => {
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return false;

    try {
      const response = await fetch(`${apiBase}/api/users/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        set({ users: get().users.map((u) => (u.id === id ? data : u)) });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  deleteUser: async (id) => {
    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    if (!apiBase || !token) return false;

    try {
      const response = await fetch(`${apiBase}/api/users/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok || response.status === 204) {
        set({ users: get().users.filter((u) => u.id !== id) });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },
}));
