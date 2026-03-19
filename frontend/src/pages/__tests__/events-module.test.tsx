import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ToastProvider } from '@/components/ui/ToastProvider';
import Events from '@/pages/Events';
import Home from '@/pages/Home';
import DashboardHome from '@/pages/DashboardHome';
import { useEventsStore, type EventItem } from '@/stores/eventsStore';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  const seed: EventItem[] = [
    {
      id: 'seed-1',
      name: 'Seed Event',
      date: '2099-01-01',
      time: '10:00',
      location: 'Main Sanctuary',
      status: 'Scheduled',
    },
  ];
  useEventsStore.setState({ events: seed, hasLoaded: true, isLoading: false, error: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Events module', () => {
  it('keeps homepage Upcoming Events synchronized with store updates', async () => {
    render(<Home />, { wrapper });
    expect(screen.getAllByText('Seed Event').length).toBeGreaterThan(0);

    useEventsStore.setState({
      events: [
        {
          id: 'new-1',
          name: 'New Event From Admin',
          date: '2099-01-02',
          time: '09:00',
          location: 'Chapel',
          status: 'Planned',
        },
        ...useEventsStore.getState().events,
      ],
    });

    expect(await screen.findAllByText('New Event From Admin')).toHaveLength(1);
  });

  it('keeps dashboard Upcoming Events synchronized with store updates', async () => {
    render(<DashboardHome />, { wrapper });
    expect(screen.getAllByText('Seed Event').length).toBeGreaterThan(0);

    useEventsStore.setState({
      events: useEventsStore
        .getState()
        .events.map((e) =>
          e.id === 'seed-1' ? { ...e, location: 'Conference Room', time: '11:15' } : e
        ),
    });

    expect(await screen.findByText('Conference Room')).toBeInTheDocument();
  });

  it('autosaves add-event draft to localStorage every 30 seconds', async () => {
    vi.useFakeTimers();
    render(<Events />, { wrapper });

    fireEvent.click(screen.getAllByRole('button', { name: /^add event$/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /add event/i });

    const nameInput = within(dialog).getByRole('textbox', { name: /event name/i });
    fireEvent.change(nameInput, { target: { value: 'Draft Event' } });

    vi.advanceTimersByTime(30_000);
    vi.runOnlyPendingTimers();

    const raw = localStorage.getItem('jhtm.events.addDraft.v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).name).toBe('Draft Event');
  });
});
