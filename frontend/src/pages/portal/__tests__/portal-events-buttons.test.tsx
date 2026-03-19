import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import PortalEvents from '@/pages/portal/PortalEvents';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useEventRegistrationsStore } from '@/stores/eventRegistrationsStore';
import { useEventsStore } from '@/stores/eventsStore';

describe('Member portal events buttons', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem(
      'user',
      JSON.stringify({ email: 'member@jhtmchurch.com', role: 'member' })
    );

    useAttendanceStore.setState({ records: [], tokens: [] });
    useEventRegistrationsStore.setState({ registrations: [] });

    useEventsStore.setState({
      events: [
        {
          id: 'svc1',
          name: 'Sunday Worship Service',
          date: '2026-03-22',
          time: '10:00',
          location: 'Sanctuary',
          status: 'Scheduled',
          category: 'Service',
          requiresRegistration: false,
        },
        {
          id: 'ev1',
          name: 'Youth Fellowship Night',
          date: '2026-03-27',
          time: '18:00',
          location: 'Hall',
          status: 'Planned',
          category: 'Youth',
          requiresRegistration: true,
          maxSlots: 1,
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders service and registration buttons and updates join state', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <MemoryRouter>
          <PortalEvents />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(await screen.findByRole('button', { name: /join service/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join event ✨/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /join event ✨/i }));
    expect(screen.getByRole('button', { name: /joined ✅/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /leave event ❌/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/0 \/ 1 spots left/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /leave event ❌/i })[0]);
    expect(screen.getByRole('button', { name: /join event ✨/i })).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 1 spots left/i)).toBeInTheDocument();
  });
});
