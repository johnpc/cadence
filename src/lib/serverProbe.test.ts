import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeServer } from './serverProbe';
import { __resetReachability, getReachability } from './reachabilityStore';

describe('probeServer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    __resetReachability();
  });

  it('a response of any kind means reachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
    );
    expect(await probeServer()).toBe(true);
    expect(getReachability()).toBe('online');
  });

  it('a network failure means unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    expect(await probeServer()).toBe(false);
    expect(getReachability()).toBe('offline');
  });

  it('a hanging connection times out as unreachable', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_u: string, init: RequestInit) =>
          new Promise((_, reject) =>
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('', 'AbortError')),
            ),
          ),
      ),
    );
    const answer = probeServer(3000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await answer).toBe(false);
  });
});
