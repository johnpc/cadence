import { afterEach, describe, expect, it, vi } from 'vitest';
import { readForceOffline, writeForceOffline, onForceOfflineChange } from './forceOfflineStore';

describe('forceOfflineStore', () => {
  afterEach(() => localStorage.clear());

  it('defaults to off', () => {
    expect(readForceOffline()).toBe(false);
  });

  it('round-trips on/off', () => {
    writeForceOffline(true);
    expect(readForceOffline()).toBe(true);
    writeForceOffline(false);
    expect(readForceOffline()).toBe(false);
  });

  it('notifies subscribers on change and unsubscribes', () => {
    const listener = vi.fn();
    const off = onForceOfflineChange(listener);
    writeForceOffline(true);
    expect(listener).toHaveBeenCalledWith(true);
    off();
    writeForceOffline(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
