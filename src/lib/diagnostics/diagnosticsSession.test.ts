import { describe, expect, it } from 'vitest';
import { sessionId } from './diagnosticsSession';

describe('sessionId', () => {
  it('is stable within a run (same id each call)', () => {
    const a = sessionId();
    const b = sessionId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});
