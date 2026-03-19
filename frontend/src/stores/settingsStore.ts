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
  isLoadingSettings: boolean;
  isLoadingUsers: boolean;
  settingsError: string | null;
  usersError: string | null;
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
  isLoadingSettings: false,
  isLoadingUsers: false,
  settingsError: null,
  usersError: null,

  loadSettings: async (opts) => {
    if (get().hasLoadedSettings && !opts?.force) return;
    if (get().isLoadingSettings) return;

    const apiBase = getApiBaseUrl();
    const token = getAuthToken();

    set({ isLoadingSettings: true, settingsError: null });

    if (!apiBase) {
      set({
        settings: null,
        hasLoadedSettings: true,
        isLoadingSettings: false,
        settingsError: 'API is not configured. Set VITE_API_URL for the frontend.',
      });
      return;
    }

    if (!token) {
      set({
        settings: null,
        hasLoadedSettings: true,
        isLoadingSettings: false,
        settingsError: 'You are not signed in. Please log in again.',
      });
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let detail: string | null = null;
        try {
          const body = (await response.json()) as { detail?: string };
          if (body?.detail) detail = body.detail;
        } catch {
          // ignore
        }

        const statusMsg =
          response.status === 401
            ? 'Unauthorized. Please sign in again.'
            : response.status === 403
              ? 'Forbidden. Admin/staff access is required to view settings.'
              : response.status === 404
                ? 'Settings not found. Ensure the system_settings row exists.'
                : `Unable to load settings (HTTP ${response.status}).`;

        set({
          settings: null,
          hasLoadedSettings: true,
          settingsError: detail ? `${statusMsg} ${detail}` : statusMsg,
        });
        return;
      }

      const data = (await response.json()) as SystemSettings;
      set({ settings: data, hasLoadedSettings: true, settingsError: null });
    } catch {
      set({
        settings: null,
        hasLoadedSettings: true,
        settingsError: 'Network error while loading settings. Please retry.',
      });
    } finally {
      set({ isLoadingSettings: false });
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
    if (get().isLoadingUsers) return;

    const apiBase = getApiBaseUrl();
    const token = getAuthToken();

    set({ isLoadingUsers: true, usersError: null });

    if (!apiBase) {
      set({
        users: [],
        hasLoadedUsers: true,
        isLoadingUsers: false,
        usersError: 'API is not configured. Set VITE_API_URL for the frontend.',
      });
      return;
    }

    if (!token) {
      set({
        users: [],
        hasLoadedUsers: true,
        isLoadingUsers: false,
        usersError: 'You are not signed in. Please log in again.',
      });
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let detail: string | null = null;
        try {
          const body = (await response.json()) as { detail?: string };
          if (body?.detail) detail = body.detail;
        } catch {
          // ignore
        }

        const statusMsg =
          response.status === 401
            ? 'Unauthorized. Please sign in again.'
            : response.status === 403
              ? 'Forbidden. Admin/staff access is required to view users.'
              : `Unable to load users (HTTP ${response.status}).`;

        set({
          users: [],
          hasLoadedUsers: true,
          usersError: detail ? `${statusMsg} ${detail}` : statusMsg,
        });
        return;
      }

      const data = (await response.json()) as { results?: UserManagementUser[] };
      set({ users: data.results || [], hasLoadedUsers: true, usersError: null });
    } catch {
      set({
        users: [],
        hasLoadedUsers: true,
        usersError: 'Network error while loading users. Please retry.',
      });
    } finally {
      set({ isLoadingUsers: false });
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
