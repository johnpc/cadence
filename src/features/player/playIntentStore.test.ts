import { afterEach, describe, expect, it } from 'vitest';
import { getPlayIntent, setPlayIntent } from './playIntentStore';

describe('playIntentStore', () => {
  afterEach(() => setPlayIntent(false));

  it('defaults to false (nothing intended before any play)', () => {
    expect(getPlayIntent()).toBe(false);
  });

  it('records and reads the user intent', () => {
    setPlayIntent(true);
    expect(getPlayIntent()).toBe(true);
    setPlayIntent(false);
    expect(getPlayIntent()).toBe(false);
  });
});
