import { describe, expect, it } from 'vitest';
import {
  Unauthenticated,
  RequestTimeout,
  HttpError,
  SubsonicError,
  REQUEST_TIMEOUT_MS,
  isRetryableError,
} from './navidromeErrors';

describe('navidromeErrors', () => {
  it('is not retryable for Unauthenticated (confirmed dead session)', () => {
    expect(isRetryableError(new Unauthenticated())).toBe(false);
  });

  it('is retryable for a timeout, network error, or 5xx transport failure', () => {
    expect(isRetryableError(new RequestTimeout())).toBe(true);
    expect(isRetryableError(new HttpError(503))).toBe(true);
    expect(isRetryableError(new HttpError(500))).toBe(true);
    expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('is NOT retryable for a 4xx transport error', () => {
    expect(isRetryableError(new HttpError(404))).toBe(false);
    expect(isRetryableError(new HttpError(400))).toBe(false);
  });

  it('is NOT retryable for a SubsonicError (business-level failure)', () => {
    expect(isRetryableError(new SubsonicError(70, 'Data not found'))).toBe(false);
    expect(isRetryableError(new SubsonicError(50, 'Unauthorized'))).toBe(false);
  });

  it('uses a sane per-request timeout', () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
