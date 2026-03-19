import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import QrCheckin from '@/pages/QrCheckin';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useEventsStore } from '@/stores/eventsStore';

describe('QR check-in', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAttendanceStore.setState({ records: [], tokens: [] });
    useEventsStore.setState({ events: [] });
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('updates Expected/Early to Present for a member scan', async () => {
    vi.setSystemTime(new Date('2026-03-22T10:05:00'));

    window.localStorage.setItem(
      'jhtm.members.v1',
      JSON.stringify([
        {
          id: 'm1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '123',
          gender: 'Female',
          category: 'Member',
          birthdate: '1990-01-01',
          ministry: 'Choir',
          status: 'Active',
        },
      ])
    );
    window.localStorage.setItem(
      'user',
      JSON.stringify({ email: 'alice@example.com', role: 'member' })
    );

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
    });

    useAttendanceStore.setState({
      tokens: [
        {
          id: 't1',
          eventId: 'svc1',
          scope: 'service',
          expiresAt: new Date('2026-03-22T12:00:00').toISOString(),
        },
      ],
      records: [
        {
          id: 'att1',
          eventId: 'svc1',
          attendeeType: 'member',
          memberId: 'm1',
          status: 'expected',
          checkinMethod: 'manual',
          checkedInAt: new Date('2026-03-22T09:30:00.000Z').toISOString(),
          checkedInBy: 'self',
        },
      ],
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/checkin/t1']}>
          <Routes>
            <Route path="/checkin/:token" element={<QrCheckin />} />
            <Route path="/" element={<div />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await vi.runAllTimersAsync();
    const rec = useAttendanceStore.getState().records.find((r) => r.id === 'att1');
    expect(rec?.status).toBe('present');
    expect(rec?.checkinMethod).toBe('qr');
  });

  it('auto-creates a guest profile and records attendance on scan', async () => {
    vi.setSystemTime(new Date('2026-03-22T10:05:00'));

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
    });

    useAttendanceStore.setState({
      tokens: [
        {
          id: 't1',
          eventId: 'svc1',
          scope: 'service',
          expiresAt: new Date('2026-03-22T12:00:00').toISOString(),
        },
      ],
      records: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/checkin/t1']}>
          <Routes>
            <Route path="/checkin/:token" element={<QrCheckin />} />
            <Route path="/" element={<div />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await vi.runAllTimersAsync();
    const guests = useAttendanceStore
      .getState()
      .records.filter((r) => r.attendeeType === 'guest' && r.eventId === 'svc1');
    expect(guests.length).toBe(1);
    expect(guests[0].guest?.fullName).toMatch(/^Guest [0-9A-F]{4}$/);
    expect(guests[0].checkinMethod).toBe('qr');
  });
});
