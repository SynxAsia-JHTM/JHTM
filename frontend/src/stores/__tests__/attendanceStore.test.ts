import { describe, expect, it, vi } from 'vitest';

describe('attendanceStore', () => {
  it('adds, updates, and removes attendance records', async () => {
    vi.resetModules();
    localStorage.clear();

    const { useAttendanceStore } = await import('@/stores/attendanceStore');

    useAttendanceStore.getState().addRecord({
      id: 'r1',
      eventId: 'e1',
      attendeeType: 'guest',
      guest: { fullName: 'Guest One' },
      status: 'present',
      checkinMethod: 'manual',
      checkedInAt: new Date().toISOString(),
      checkedInBy: 'admin',
    });

    expect(useAttendanceStore.getState().records).toHaveLength(1);

    useAttendanceStore.getState().updateRecord('r1', { status: 'late' });
    expect(useAttendanceStore.getState().records[0].status).toBe('late');

    useAttendanceStore.getState().removeRecord('r1');
    expect(useAttendanceStore.getState().records).toHaveLength(0);
  });

  it('creates and marks tokens used', async () => {
    vi.resetModules();
    localStorage.clear();
    const { useAttendanceStore } = await import('@/stores/attendanceStore');

    useAttendanceStore.getState().createToken({
      id: 't1',
      eventId: 'e1',
      scope: 'service',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(useAttendanceStore.getState().tokens).toHaveLength(1);

    useAttendanceStore.getState().markTokenUsed('t1');
    expect(useAttendanceStore.getState().tokens[0].usedAt).toBeTruthy();
  });
});
