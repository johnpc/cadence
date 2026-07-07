import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
  },
}));

import { deviceId, ensureDeviceId } from './deviceId';

describe('deviceId', () => {
  beforeEach(() => store.clear());

  it('generates and persists a stable id, then returns it synchronously', async () => {
    const first = await ensureDeviceId();
    expect(first).toBeTruthy();
    expect(deviceId()).toBe(first);
    // A second ensure reads the persisted value — same id, not a new one.
    const second = await ensureDeviceId();
    expect(second).toBe(first);
  });
});
