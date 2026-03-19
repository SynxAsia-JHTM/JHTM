import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { ToastProvider } from '@/components/ui/ToastProvider';
import PortalDashboard from '@/pages/portal/PortalDashboard';
import PortalPrayers from '@/pages/portal/PortalPrayers';
import { usePrayerRequestsStore } from '@/stores/prayerRequestsStore';

vi.mock('@/lib/config', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ToastProvider>
  );
}

describe('Prayer requests (member portal)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    usePrayerRequestsStore.setState({ myRequests: [], adminRequests: [], hasLoadedMy: false });
  });

  it('submits a request and shows it on the dashboard immediately', async () => {
    const user = userEvent.setup();

    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 123, email: 'member@example.com' }));

    const record = {
      id: 'pr-1',
      user_id: 123,
      user_email: 'member@example.com',
      message: 'Please pray for my family.',
      visibility: 'leaders',
      is_anonymous: true,
      status: 'Submitted',
      created_at: new Date('2099-01-01T10:00:00.000Z').toISOString(),
    };

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/prayer-requests/') && init?.method === 'POST') {
        return new Response(JSON.stringify(record), { status: 201 });
      }
      if (url.endsWith('/api/prayer-requests/me/')) {
        return new Response(JSON.stringify({ results: [record] }), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const prayersRender = render(<PortalPrayers />, { wrapper });

    await user.click(screen.getAllByRole('button', { name: /share a prayer/i })[0]);
    const dialog = await screen.findByRole('dialog', { name: /share a prayer/i });

    await user.type(
      within(dialog).getByPlaceholderText(/how can we pray for you/i),
      record.message
    );
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: /visibility/i }),
      'leaders'
    );
    await user.click(within(dialog).getByRole('checkbox', { name: /submit anonymously/i }));
    await user.click(within(dialog).getByRole('button', { name: /share a prayer/i }));

    prayersRender.unmount();
    render(<PortalDashboard />, { wrapper });

    expect(await screen.findByText('My Prayer Requests')).toBeInTheDocument();
    expect(screen.getAllByText(record.message).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
  });
});
