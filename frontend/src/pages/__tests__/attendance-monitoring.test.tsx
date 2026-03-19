import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import Attendance from '@/pages/Attendance';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useEventsStore } from '@/stores/eventsStore';
import { useMembersStore } from '@/stores/membersStore';

vi.mock('@/lib/apiClient', () => ({
  apiRequest: async (path: string) => {
    if (path.startsWith('/api/attendance/')) {
      return {
        ok: true,
        data: {
          results: [
            {
              id: 'att1',
              event_id: 'svc1',
              attendee_type: 'member',
              member_id: 'm1',
              member_name: 'Alice Johnson',
              status: 'present',
              checkin_method: 'manual',
              checked_in_at: new Date('2026-03-22T10:05:00.000Z').toISOString(),
              notes: 'Front row',
            },
          ],
        },
      } as const;
    }
    return { ok: false, status: 404, detail: 'not mocked' } as const;
  },
}));

describe('Admin attendance monitoring', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();

    useEventsStore.setState({
      events: [
        {
          id: 'svc1',
          name: 'Sunday Worship Service',
          date: '2026-03-22',
          time: '10:00',
          location: 'Main Sanctuary',
          status: 'Scheduled',
          category: 'Service',
        },
      ],
      hasLoaded: true,
      isLoading: false,
      error: null,
    });

    useMembersStore.setState({
      me: null,
      members: [
        {
          id: 'm1',
          user_id: 1,
          name: 'Alice Johnson',
          email: 'alice@example.com',
          status: 'Active',
        },
      ],
      hasLoadedMe: true,
      hasLoadedMembers: true,
      isLoadingMe: false,
      isLoadingMembers: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders record with required columns and status label', async () => {
    render(
      <ToastProvider>
        <Attendance />
      </ToastProvider>
    );

    expect(screen.getByText('Member Name')).toBeInTheDocument();
    expect(screen.getByText('Attendance Status')).toBeInTheDocument();
    expect(screen.getByText('Check-in Method')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText(/I'm Here/i)).toBeInTheDocument();
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByText('Front row')).toBeInTheDocument();
  });
});
