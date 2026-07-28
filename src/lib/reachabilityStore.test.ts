import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getReachability,
  markReachable,
  markUnreachable,
  onReachabilityChange,
  __resetReachability,
} from './reachabilityStore';

afterEach(() => {
  vi.restoreAllMocks();
  __resetReachability();
});

describe('reachabilityStore', () => {
  it('starts pending (offline-first) when navigator reports online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    __resetReachability();
    expect(getReachability()).toBe('pending');
  });

  it('seeds offline when navigator reliably reports offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    __resetReachability();
    expect(getReachability()).toBe('offline');
  });

  it('flips to online only once a request succeeds', () => {
    expect(getReachability()).toBe('pending');
    markReachable();
    expect(getReachability()).toBe('online');
  });

  it('flips to offline on a network failure', () => {
    markReachable();
    markUnreachable();
    expect(getReachability()).toBe('offline');
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const spy = vi.fn();
    const off = onReachabilityChange(spy);
    markReachable();
    expect(spy).toHaveBeenCalledTimes(1);
    markReachable(); // no-op, same state
    expect(spy).toHaveBeenCalledTimes(1);
    off();
    markUnreachable();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('browser offline event forces offline; online event only clears to pending', () => {
    const off = onReachabilityChange(() => {});
    markReachable();
    window.dispatchEvent(new Event('offline'));
    expect(getReachability()).toBe('offline');
    // Optimistic online event must NOT assert online — only clear to pending.
    window.dispatchEvent(new Event('online'));
    expect(getReachability()).toBe('pending');
    off();
  });
});
