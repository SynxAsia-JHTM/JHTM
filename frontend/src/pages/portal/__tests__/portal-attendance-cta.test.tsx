import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/config', () => ({
  getApiBaseUrl: () => null,
}));

import PortalDashboard from '@/pages/portal/PortalDashboard';
import { useAttendanceStore } from '@/stores/attendanceStore';

describe('Member dashboard attendance CTAs', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem(
      'user',
      JSON.stringify({ email: 'member@jhtmchurch.com', role: 'member' })
    );
    useAttendanceStore.setState({ records: [], tokens: [] });
  });

  afterEach(() => {
    cleanup();
  });
  it('marks attendance and updates button + stats immediately', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PortalDashboard />
      </MemoryRouter>
    );

    const getStatValue = (label: string) => {
      const card = screen.getByText(label).closest('button');
      expect(card).not.toBeNull();
      const valueEl = within(card as HTMLElement).getByText(/\d+/);
      return valueEl.textContent;
    };

    expect(getStatValue('Services Attended')).toBe('0');
    expect(getStatValue('Check-ins This Month')).toBe('0');

    const hereButtons = await screen.findAllByRole('button', { name: /i'm here/i });
    await user.click(hereButtons[0]);

    expect(screen.getAllByRole('button', { name: /joined ✅/i }).length).toBeGreaterThan(0);
    expect(getStatValue('Services Attended')).toBe('1');
    expect(getStatValue('Check-ins This Month')).toBe('1');
  });
});
