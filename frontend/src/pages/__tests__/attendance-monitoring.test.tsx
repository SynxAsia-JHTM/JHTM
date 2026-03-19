import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import Attendance from '@/pages/Attendance';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useEventsStore } from '@/stores/eventsStore';

describe('Admin attendance monitoring', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
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
      records: [
        {
          id: 'att1',
          eventId: 'svc1',
          attendeeType: 'member',
          memberId: 'm1',
          status: 'present',
          checkinMethod: 'manual',
          checkedInAt: new Date('2026-03-22T10:05:00.000Z').toISOString(),
          checkedInBy: 'self',
          notes: 'Front row',
        },
      ],
      tokens: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders record with required columns and status label', () => {
    render(
      <ToastProvider>
        <Attendance />
      </ToastProvider>
    );

    expect(screen.getByText('Member Name')).toBeInTheDocument();
    expect(screen.getByText('Attendance Status')).toBeInTheDocument();
    expect(screen.getByText('Check-in Method')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText(/I'm Here/i)).toBeInTheDocument();
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByText('Front row')).toBeInTheDocument();
  });
});
