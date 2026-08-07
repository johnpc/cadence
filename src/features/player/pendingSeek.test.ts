import { afterEach, describe, expect, it } from 'vitest';
import { setPendingSeek, takePendingSeek } from './pendingSeek';

// Clear any pending state between tests (module is session-scoped).
afterEach(() => {
  takePendingSeek('__any__');
});

describe('pendingSeek', () => {
  it('returns the pending seconds for the matching id, then clears it', () => {
    setPendingSeek('a', 42);
    expect(takePendingSeek('a')).toBe(42);
    // consumed — a second take returns null
    expect(takePendingSeek('a')).toBeNull();
  });

  it('leaves a pending seek in place for a non-matching id', () => {
    setPendingSeek('a', 10);
    expect(takePendingSeek('b')).toBeNull();
    // still available for the right id
    expect(takePendingSeek('a')).toBe(10);
  });

  it('returns null for an undefined id and when nothing is pending', () => {
    expect(takePendingSeek(undefined)).toBeNull();
    expect(takePendingSeek('x')).toBeNull();
  });

  it('keeps only the most recent request', () => {
    setPendingSeek('a', 1);
    setPendingSeek('a', 2);
    expect(takePendingSeek('a')).toBe(2);
  });
});
