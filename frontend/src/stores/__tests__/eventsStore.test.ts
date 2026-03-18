import { describe, expect, it, vi } from 'vitest';

const storageKey = 'jhtm.events.v1';

function seedStoredEvents() {
  return [
    {
      id: 'x1',
      name: 'Stored Event',
      date: '2099-01-01',
      time: '10:00',
      location: 'Main Sanctuary',
      status: 'Scheduled',
    },
  ];
}

describe('eventsStore', () => {
  it('loads default events when localStorage is empty', async () => {
    vi.resetModules();
    localStorage.clear();

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(useEventsStore.getState().events.length).toBeGreaterThan(0);
  });

  it('loads stored events when localStorage contains an array', async () => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem(storageKey, JSON.stringify(seedStoredEvents()));

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(useEventsStore.getState().events[0].name).toBe('Stored Event');
  });

  it('falls back to defaults on invalid JSON', async () => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem(storageKey, '{not-json');

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(useEventsStore.getState().events[0].name).not.toBe('Stored Event');
  });

  it('falls back to defaults when JSON is not an array', async () => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem(storageKey, JSON.stringify({ hello: 'world' }));

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(Array.isArray(useEventsStore.getState().events)).toBe(true);
    expect(useEventsStore.getState().events[0].name).not.toBe('Stored Event');
  });

  it('applies storage-event updates via replaceEventsFromSync', async () => {
    vi.resetModules();
    localStorage.clear();
    const { useEventsStore } = await import('@/stores/eventsStore');

    const next = seedStoredEvents();
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(next),
      })
    );

    expect(useEventsStore.getState().events[0].name).toBe('Stored Event');
  });

  it('ignores unrelated storage events and malformed payloads', async () => {
    vi.resetModules();
    localStorage.clear();
    const { useEventsStore } = await import('@/stores/eventsStore');

    const before = useEventsStore.getState().events;
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'other.key',
        newValue: JSON.stringify(seedStoredEvents()),
      })
    );
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: '{bad-json' }));

    expect(useEventsStore.getState().events).toEqual(before);
  });

  it('supports BroadcastChannel updates when available', async () => {
    vi.resetModules();
    localStorage.clear();

    const listeners: Array<(event: MessageEvent) => void> = [];
    class FakeBroadcastChannel {
      addEventListener(_: string, cb: (event: MessageEvent) => void) {
        listeners.push(cb);
      }
      postMessage() {
        return;
      }
    }

    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    const { useEventsStore } = await import('@/stores/eventsStore');

    const next = seedStoredEvents();
    listeners.forEach((cb) =>
      cb(new MessageEvent('message', { data: { type: 'events:update', events: next } }))
    );

    expect(useEventsStore.getState().events[0].name).toBe('Stored Event');
  });

  it('ignores malformed BroadcastChannel messages', async () => {
    vi.resetModules();
    localStorage.clear();

    const listeners: Array<(event: MessageEvent) => void> = [];
    class FakeBroadcastChannel {
      addEventListener(_: string, cb: (event: MessageEvent) => void) {
        listeners.push(cb);
      }
      postMessage() {
        return;
      }
    }

    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    const { useEventsStore } = await import('@/stores/eventsStore');
    const before = useEventsStore.getState().events;

    listeners.forEach((cb) =>
      cb(new MessageEvent('message', { data: { type: 'other', events: seedStoredEvents() } }))
    );
    listeners.forEach((cb) =>
      cb(
        new MessageEvent('message', { data: { type: 'events:update', events: { hello: 'world' } } })
      )
    );

    expect(useEventsStore.getState().events).toEqual(before);
  });

  it('handles localStorage persistence failures gracefully', async () => {
    vi.resetModules();
    localStorage.clear();
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('fail');
    };

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(() =>
      useEventsStore.getState().addEvent({
        id: 'p1',
        name: 'Persist Fail',
        date: '2099-01-03',
        time: '10:00',
        location: 'Chapel',
        status: 'Scheduled',
      })
    ).not.toThrow();

    Storage.prototype.setItem = original;
  });

  it('skips persistence when window is undefined', async () => {
    vi.resetModules();
    localStorage.clear();
    const prevWindow = (globalThis as unknown as { window?: unknown }).window;
    vi.stubGlobal('window', undefined);

    const { useEventsStore } = await import('@/stores/eventsStore');
    expect(() => useEventsStore.getState().setEvents([])).not.toThrow();

    vi.unstubAllGlobals();
    if (typeof prevWindow !== 'undefined') {
      vi.stubGlobal('window', prevWindow);
    }
  });

  it('generates event ids via crypto.randomUUID when available', async () => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-123' });

    const { createEventId } = await import('@/stores/eventsStore');
    expect(createEventId()).toBe('uuid-123');
  });
});
