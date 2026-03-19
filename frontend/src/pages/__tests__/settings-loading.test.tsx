import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Settings from '@/pages/Settings';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useSettingsStore } from '@/stores/settingsStore';

vi.mock('@/lib/config', () => ({
  getApiBaseUrl: () => 'http://api.example.test',
}));

function renderSettings() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('Settings loading resilience', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    useSettingsStore.setState({
      settings: null,
      users: [],
      hasLoadedSettings: false,
      hasLoadedUsers: false,
      isLoadingSettings: false,
      isLoadingUsers: false,
      settingsError: null,
      usersError: null,
    });
    vi.restoreAllMocks();
  });

  it('shows a non-stuck error state when token is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderSettings();

    expect(await screen.findByText(/We couldn’t load this page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows a non-stuck error state on 401 responses', async () => {
    window.localStorage.setItem('token', 'mock-token');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid token' }),
    } as unknown as Response);

    renderSettings();

    expect(await screen.findByText(/We couldn’t load this page/i)).toBeInTheDocument();
    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
