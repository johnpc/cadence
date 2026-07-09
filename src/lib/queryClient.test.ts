import { describe, expect, it } from 'vitest';
import { queryClient } from './queryClient';
import { Unauthenticated, RequestTimeout } from './jellyfinErrors';

describe('queryClient', () => {
  const defaults = queryClient.getDefaultOptions().queries;

  it('does not refetch on window focus', () => {
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });

  it('caches data across navigation (baseline staleTime + gcTime)', () => {
    expect(defaults?.staleTime).toBe(30_000);
    expect(defaults?.gcTime).toBe(10 * 60_000);
  });

  it('retries transient failures up to 2x with capped backoff', () => {
    const retry = defaults?.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new RequestTimeout())).toBe(true);
    expect(retry(1, new RequestTimeout())).toBe(true);
    expect(retry(2, new RequestTimeout())).toBe(false); // give up after 2 retries
    const delay = defaults?.retryDelay as (n: number) => number;
    expect(delay(0)).toBe(1000);
    expect(delay(10)).toBe(5000); // capped
  });

  it('never retries a confirmed 401 (dead session)', () => {
    const retry = defaults?.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new Unauthenticated())).toBe(false);
  });
});
