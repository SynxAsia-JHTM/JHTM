import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  useEventsStore.setState({ events: seed });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Events module', () => {
  it('keeps homepage Upcoming Events synchronized with store updates', async () => {
    render(<Home />, { wrapper });
    expect(screen.getAllByText('Seed Event').length).toBeGreaterThan(0);

    useEventsStore.getState().addEvent({
      id: 'new-1',
      name: 'New Event From Admin',
      date: '2099-01-02',
      time: '09:00',
      location: 'Chapel',
      status: 'Planned',
    });

    expect(await screen.findAllByText('New Event From Admin')).toHaveLength(1);
  });

  it('keeps dashboard Upcoming Events synchronized with store updates', async () => {
    render(<DashboardHome />, { wrapper });
    expect(screen.getAllByText('Seed Event').length).toBeGreaterThan(0);

    useEventsStore.getState().updateEvent('seed-1', { location: 'Conference Room', time: '11:15' });

    expect(await screen.findByText('Conference Room')).toBeInTheDocument();
  });

  it('supports add, edit, delete flows with inline validation', async () => {
    const user = userEvent.setup();

    render(<Events />, { wrapper });

    await user.click(screen.getByRole('button', { name: /add event/i }));
    const dialog = await screen.findByRole('dialog', { name: /add event/i });

    const saveButton = within(dialog).getByRole('button', { name: /^save$/i });
    expect(saveButton).toBeDisabled();

    const nameInput = within(dialog).getByRole('textbox', { name: /event name/i });
    await user.type(nameInput, 'My Added Event');

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    expect(await screen.findByText('My Added Event')).toBeInTheDocument();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const editDialog = await screen.findByRole('dialog', { name: /edit event/i });
    const venueInput = within(editDialog).getByPlaceholderText(/select venue/i);
    await user.clear(venueInput);
    await user.type(venueInput, 'Conference Room');

    const editSaveButton = within(editDialog).getByRole('button', { name: /^save$/i });
    await user.click(editSaveButton);

    expect(await screen.findByText('Conference Room')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const confirmDialog = await screen.findByRole('dialog', { name: /delete event/i });
    await user.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText('My Added Event')).toBeNull();
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
