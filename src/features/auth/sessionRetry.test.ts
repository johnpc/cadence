// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachSessionRetry, retryDelay, RETRY_DELAYS_MS, type RetryEnv } from './sessionRetry';

/** A fake document: records listeners so tests can fire resume/visibility. */
function fakeEnv() {
  const listeners = new Map<string, Set<() => void>>();
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (t: string, l: () => void) => {
      if (!listeners.has(t)) listeners.set(t, new Set());
      listeners.get(t)!.add(l);
    },
    removeEventListener: (t: string, l: () => void) => listeners.get(t)?.delete(l),
  };
  const fire = (t: string) => listeners.get(t)?.forEach((l) => l());
  const env: RetryEnv = {
    doc: doc as unknown as RetryEnv['doc'],
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (id) => clearTimeout(id),
  };
  return { env, doc, fire, count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0) };
}

describe('retryDelay', () => {
  it('backs off and then repeats the last wait', () => {
    expect(RETRY_DELAYS_MS.map((_, i) => retryDelay(i))).toEqual(RETRY_DELAYS_MS);
    expect(retryDelay(99)).toBe(RETRY_DELAYS_MS.at(-1));
  });
});

describe('attachSessionRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries on the backoff schedule', async () => {
    const { env } = fakeEnv();
    const retry = vi.fn(() => Promise.resolve());
    const detach = attachSessionRetry(retry, env);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] - 1);
    expect(retry).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(retry).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1]);
    expect(retry).toHaveBeenCalledTimes(2);
    detach();
  });

  it('retries at once when the app comes back to the foreground', async () => {
    const { env, fire, doc } = fakeEnv();
    const retry = vi.fn(() => Promise.resolve());
    const detach = attachSessionRetry(retry, env);
    fire('resume');
    await vi.advanceTimersByTimeAsync(0);
    expect(retry).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'hidden';
    fire('visibilitychange'); // going to the background is not a reason to retry
    await vi.advanceTimersByTimeAsync(0);
    expect(retry).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'visible';
    fire('visibilitychange');
    await vi.advanceTimersByTimeAsync(0);
    expect(retry).toHaveBeenCalledTimes(2);
    detach();
  });

  it('runs one retry at a time', async () => {
    const { env, fire } = fakeEnv();
    let finish!: () => void;
    const retry = vi.fn(() => new Promise<void>((res) => (finish = res)));
    const detach = attachSessionRetry(retry, env);
    fire('resume');
    fire('resume');
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    expect(retry).toHaveBeenCalledTimes(1);
    finish();
    detach();
  });

  it('keeps going after a retry throws', async () => {
    const { env } = fakeEnv();
    const retry = vi.fn(() => Promise.reject(new Error('still locked')));
    const detach = attachSessionRetry(retry, env);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] + RETRY_DELAYS_MS[1]);
    expect(retry).toHaveBeenCalledTimes(2);
    detach();
  });

  it('detaching stops timers and listeners', async () => {
    const { env, fire, count } = fakeEnv();
    const retry = vi.fn(() => Promise.resolve());
    const detach = attachSessionRetry(retry, env);
    expect(count()).toBe(2);
    detach();
    expect(count()).toBe(0);
    fire('resume');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(retry).not.toHaveBeenCalled();
  });

  it('a retry in flight when detached does not schedule another', async () => {
    const { env } = fakeEnv();
    let finish!: () => void;
    const retry = vi.fn(() => new Promise<void>((res) => (finish = res)));
    const detach = attachSessionRetry(retry, env);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    detach();
    finish();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('uses the real document and timers by default', async () => {
    const add = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal('document', {
      addEventListener: add,
      removeEventListener: remove,
      visibilityState: 'visible',
    });
    const retry = vi.fn(() => Promise.resolve());
    const detach = attachSessionRetry(retry);
    expect(add).toHaveBeenCalledWith('resume', expect.any(Function));
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    expect(retry).toHaveBeenCalledTimes(1);
    detach();
    expect(remove).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
