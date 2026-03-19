import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Attendance from '@/pages/Attendance';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useEventsStore } from '@/stores/eventsStore';

describe('Admin QR Attendance widget', () => {
  let writeTextSpy: ReturnType<typeof vi.fn>;
  let execCommandSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();

    useEventsStore.setState({
      events: [
        {
          id: 'svc1',
          name: 'Sunday Worship',
          date: '2026-03-23',
          time: '09:00',
          location: 'Main Sanctuary',
          status: 'Scheduled',
          category: 'Service',
        },
      ],
    });

    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    execCommandSpy = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand?: (cmd: string) => boolean }).execCommand =
      execCommandSpy;

    try {
      (
        navigator as unknown as { clipboard?: { writeText: (text: string) => Promise<void> } }
      ).clipboard = {
        writeText: writeTextSpy,
      };
    } catch {
      // ignore
    }

    Object.defineProperty(Navigator.prototype, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens widget, shows service info, and copies attendance link', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Attendance />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /attend via qr/i }));

    expect(
      screen.getByText(/share this link or open it on a device to record attendance/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sunday Worship \u2022 March 23, 2026 \u2022 9:00 AM \u2022 Main Sanctuary/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This link is valid for 10 minutes to record attendance\./i)
    ).toBeInTheDocument();

    const input = screen.getByLabelText('Attendance Link') as HTMLInputElement;
    expect(input.value).toMatch(/\/checkin\//);

    await user.click(screen.getByRole('button', { name: /copy attendance link/i }));
    const toast = await screen.findByRole('status');
    expect(toast).toHaveTextContent('Copied');
    expect(toast).toHaveTextContent('Attendance link copied to clipboard.');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText(/check-in/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/check in/i)).not.toBeInTheDocument();
  });
});
