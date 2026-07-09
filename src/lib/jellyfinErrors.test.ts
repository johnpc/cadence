import { describe, expect, it } from 'vitest';
import {
  Unauthenticated,
  RequestTimeout,
  REQUEST_TIMEOUT_MS,
  isRetryableError,
} from './jellyfinErrors';

describe('jellyfinErrors', () => {
  it('is not retryable for a 401 (confirmed dead session)', () => {
    expect(isRetryableError(new Unauthenticated())).toBe(false);
  });

  it('is retryable for a timeout, network error, or 5xx', () => {
    expect(isRetryableError(new RequestTimeout())).toBe(true);
    expect(isRetryableError(new Error('Jellyfin GET /x failed: 503'))).toBe(true);
    expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('uses a sane per-request timeout', () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
