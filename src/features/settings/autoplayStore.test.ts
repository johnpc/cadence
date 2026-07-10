import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAutoplay, writeAutoplay, onAutoplayChange } from './autoplayStore';

describe('autoplayStore', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to ON when nothing is stored', () => {
    expect(readAutoplay()).toBe(true);
  });

  it('round-trips off/on', () => {
    writeAutoplay(false);
    expect(readAutoplay()).toBe(false);
    writeAutoplay(true);
    expect(readAutoplay()).toBe(true);
  });

  it('only an explicit "off" disables it (garbage reads as on)', () => {
    localStorage.setItem('cadence.autoplay', 'nonsense');
    expect(readAutoplay()).toBe(true);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const seen: boolean[] = [];
    const off = onAutoplayChange((on) => seen.push(on));
    writeAutoplay(false);
    writeAutoplay(true);
    off();
    writeAutoplay(false);
    expect(seen).toEqual([false, true]);
  });
});
