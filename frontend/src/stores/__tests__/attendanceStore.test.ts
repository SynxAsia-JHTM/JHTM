import { describe, expect, it, vi } from 'vitest';

describe('attendanceStore (API-backed)', () => {
  it('selfAttend posts then refreshes myRecords', async () => {
    vi.resetModules();

    const apiRequest = vi
      .fn()
      .mockResolvedValueOnce({ ok: true as const, data: { id: 'a1' } })
      .mockResolvedValueOnce({
        ok: true as const,
        data: {
          results: [
            {
              id: 'r1',
              event_id: 'e1',
              attendee_type: 'member',
              member_id: 'm1',
              member_name: 'Member One',
              guest: null,
              status: 'present',
              checkin_method: 'manual',
              checked_in_at: new Date('2026-01-01T10:00:00.000Z').toISOString(),
              notes: null,
            },
          ],
        },
      });

    vi.doMock('@/lib/apiClient', () => ({ apiRequest }));
    const { useAttendanceStore } = await import('@/stores/attendanceStore');

    const ok = await useAttendanceStore.getState().selfAttend({ eventId: 'e1', status: 'present' });
    expect(ok).toBe(true);
    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(apiRequest.mock.calls[0][0]).toBe('/api/attendance/');
    expect(apiRequest.mock.calls[1][0]).toBe('/api/attendance/me/');
    expect(useAttendanceStore.getState().myRecords[0].id).toBe('r1');
  });

  it('selfAttend rolls back optimistic update on API failure', async () => {
    vi.resetModules();

    const apiRequest = vi.fn().mockResolvedValueOnce({ ok: false as const, status: 401, detail: 'Unauthorized' });
    vi.doMock('@/lib/apiClient', () => ({ apiRequest }));
    const { useAttendanceStore } = await import('@/stores/attendanceStore');

    useAttendanceStore.setState({
      myRecords: [
        {
          id: 'existing',
          eventId: 'e0',
          attendeeType: 'member',
          memberId: 'm0',
          memberName: 'Existing',
          guest: null,
          status: 'present',
          checkinMethod: 'manual',
          checkedInAt: new Date('2026-01-01T09:00:00.000Z').toISOString(),
          notes: null,
        },
      ],
      error: null,
    });

    const ok = await useAttendanceStore.getState().selfAttend({ eventId: 'e1', status: 'present' });
    expect(ok).toBe(false);
    expect(useAttendanceStore.getState().myRecords).toHaveLength(1);
    expect(useAttendanceStore.getState().myRecords[0].id).toBe('existing');
  });

  it('createServiceToken returns a usable checkin URL', async () => {
    vi.resetModules();

    const apiRequest = vi
      .fn()
      .mockResolvedValueOnce({ ok: true as const, data: { id: 't1', expires_at: new Date().toISOString() } });
    vi.doMock('@/lib/apiClient', () => ({ apiRequest }));
    const { useAttendanceStore } = await import('@/stores/attendanceStore');

    const token = await useAttendanceStore.getState().createServiceToken('e1', 10);
    expect(token?.tokenId).toBe('t1');
    expect(token?.url).toContain('/checkin/t1');
  });
});
