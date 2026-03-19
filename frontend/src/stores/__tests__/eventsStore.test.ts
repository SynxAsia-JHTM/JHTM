import { describe, expect, it, vi } from 'vitest';

describe('eventsStore (API-backed)', () => {
  it('loadEvents maps API fields into EventItem', async () => {
    vi.resetModules();

    const apiRequest = vi.fn().mockResolvedValueOnce({
      ok: true as const,
      data: {
        results: [
          {
            id: 'e1',
            name: 'Sunday Worship',
            date: '2026-03-23',
            time: '09:00',
            location: 'Main Sanctuary',
            status: 'Scheduled',
            category: 'service',
            speaker: null,
            requires_registration: true,
            max_slots: 10,
            registrations_count: 2,
            remaining_slots: 8,
            is_registered: true,
          },
        ],
      },
    });

    vi.doMock('@/lib/apiClient', () => ({ apiRequest }));
    const { useEventsStore } = await import('@/stores/eventsStore');

    await useEventsStore.getState().loadEvents({ force: true });
    const ev = useEventsStore.getState().events[0];
    expect(ev.id).toBe('e1');
    expect(ev.requiresRegistration).toBe(true);
    expect(ev.maxSlots).toBe(10);
    expect(ev.registrationsCount).toBe(2);
    expect(ev.remainingSlots).toBe(8);
    expect(ev.isRegistered).toBe(true);
  });

  it('registerForEvent calls the register endpoint then reloads events', async () => {
    vi.resetModules();

    const apiRequest = vi
      .fn()
      .mockResolvedValueOnce({ ok: true as const, data: { ok: true } })
      .mockResolvedValueOnce({ ok: true as const, data: { results: [] } });
    vi.doMock('@/lib/apiClient', () => ({ apiRequest }));
    const { useEventsStore } = await import('@/stores/eventsStore');

    const ok = await useEventsStore.getState().registerForEvent('e1');
    expect(ok).toBe(true);
    expect(apiRequest.mock.calls[0][0]).toBe('/api/events/e1/register/');
    expect(apiRequest.mock.calls[1][0]).toBe('/api/events/');
  });
});
