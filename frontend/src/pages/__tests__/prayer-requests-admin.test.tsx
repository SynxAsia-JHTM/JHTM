import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToastProvider } from '@/components/ui/ToastProvider';
import PrayerRequestsAdmin from '@/pages/PrayerRequestsAdmin';

vi.mock('@/lib/config', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('Admin prayer requests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders, edits, and deletes requests', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'admin-token');

    let rows = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: 7,
        user_email: 'member@example.com',
        message: 'Please pray for my health.',
        visibility: 'private',
        is_anonymous: false,
        status: 'Submitted',
        created_at: new Date('2099-01-01T10:00:00.000Z').toISOString(),
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/prayer-requests/') && (!init || init.method === undefined)) {
        return new Response(JSON.stringify({ results: rows }), { status: 200 });
      }

      if (url.includes('/api/prayer-requests/') && init?.method === 'PATCH') {
        const id = url.split('/api/prayer-requests/')[1]?.split('/')[0] ?? '';
        const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
        rows = rows.map((r) =>
          r.id === id
            ? {
                ...r,
                message: typeof body.message === 'string' ? body.message : r.message,
                visibility: typeof body.visibility === 'string' ? body.visibility : r.visibility,
                is_anonymous:
                  typeof body.is_anonymous === 'boolean' ? body.is_anonymous : r.is_anonymous,
              }
            : r
        );
        const updated = rows.find((r) => r.id === id);
        return new Response(
          JSON.stringify({
            id,
            user_id: updated?.user_id,
            message: updated?.message,
            visibility: updated?.visibility,
            is_anonymous: updated?.is_anonymous,
            status: updated?.status,
            created_at: updated?.created_at,
          }),
          { status: 200 }
        );
      }

      if (url.includes('/api/prayer-requests/') && init?.method === 'DELETE') {
        const id = url.split('/api/prayer-requests/')[1]?.split('/')[0] ?? '';
        rows = rows.filter((r) => r.id !== id);
        return new Response(null, { status: 204 });
      }

      return new Response('Not found', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<PrayerRequestsAdmin />, { wrapper });

    expect(await screen.findByText('All Submissions')).toBeInTheDocument();
    expect(await screen.findByText('Please pray for my health.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit prayer request/i }));
    const editDialog = await screen.findByRole('dialog', { name: /edit prayer request/i });
    const textarea = within(editDialog).getByRole('textbox', { name: /message/i });
    await user.clear(textarea);
    await user.type(textarea, 'Updated message');
    await user.selectOptions(
      within(editDialog).getByRole('combobox', { name: /visibility/i }),
      'public'
    );
    await user.click(within(editDialog).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Updated message')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete prayer request/i }));
    const deleteDialog = await screen.findByRole('dialog', { name: /delete prayer request\?/i });
    await user.click(within(deleteDialog).getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText('Updated message')).not.toBeInTheDocument();
  });
});
