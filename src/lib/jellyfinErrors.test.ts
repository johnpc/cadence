import { describe, expect, it } from 'vitest';
import {
  Unauthenticated,
  RequestTimeout,
  HttpError,
  REQUEST_TIMEOUT_MS,
  isRetryableError,
} from './jellyfinErrors';

describe('jellyfinErrors', () => {
  it('is not retryable for a 401 (confirmed dead session)', () => {
    expect(isRetryableError(new Unauthenticated())).toBe(false);
  });

  it('is retryable for a timeout, network error, or 5xx', () => {
    expect(isRetryableError(new RequestTimeout())).toBe(true);
    expect(isRetryableError(new HttpError(503))).toBe(true);
    expect(isRetryableError(new HttpError(500))).toBe(true);
    expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('is NOT retryable for a 4xx client error (deleted/missing item won’t reappear)', () => {
    expect(isRetryableError(new HttpError(404))).toBe(false);
    expect(isRetryableError(new HttpError(400))).toBe(false);
    expect(isRetryableError(new HttpError(403))).toBe(false);
  });

  it('uses a sane per-request timeout', () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
