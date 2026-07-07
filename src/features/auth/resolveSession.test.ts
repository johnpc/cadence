import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authClient', () => ({ currentUsername: vi.fn() }));
import { currentUsername } from './authClient';
import { resolveSession } from './resolveSession';

const noDelay = () => Promise.resolve();

describe('resolveSession', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('reports authenticated with the username', async () => {
    vi.mocked(currentUsername).mockResolvedValue('cadence-test');
    expect(await resolveSession(3, noDelay)).toEqual({
      status: 'authenticated',
      username: 'cadence-test',
    });
  });

  it('reports unauthenticated on a confirmed no-session', async () => {
    vi.mocked(currentUsername).mockResolvedValue(null);
    expect(await resolveSession(3, noDelay)).toEqual({ status: 'unauthenticated', username: null });
  });

  it('retries transient failures, then succeeds', async () => {
    vi.mocked(currentUsername)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce('cadence-test');
    expect(await resolveSession(3, noDelay)).toEqual({
      status: 'authenticated',
      username: 'cadence-test',
    });
    expect(currentUsername).toHaveBeenCalledTimes(2);
  });

  it('stays loading (never signs out) when all retries fail — e.g. offline', async () => {
    vi.mocked(currentUsername).mockRejectedValue(new Error('offline'));
    expect(await resolveSession(3, noDelay)).toEqual({ status: 'loading', username: null });
    expect(currentUsername).toHaveBeenCalledTimes(3);
  });

  it('uses the real backoff delay by default', async () => {
    vi.useFakeTimers();
    vi.mocked(currentUsername).mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce('u');
    const promise = resolveSession(2); // default backoff
    await vi.runAllTimersAsync();
    expect(await promise).toEqual({ status: 'authenticated', username: 'u' });
    vi.useRealTimers();
  });
});
