import { describe, expect, it } from 'vitest';
import { random } from './random';

describe('random', () => {
  it('returns a value in [0, 1)', () => {
    for (let i = 0; i < 20; i++) {
      const r = random();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});
