import { afterEach, describe, expect, it } from 'vitest';
import { getCastProgress, setCastProgress, onCastProgressChange } from './castProgress';

describe('castProgress', () => {
  afterEach(() => setCastProgress({ position: 0, duration: 0 }));

  it('starts at zero', () => {
    expect(getCastProgress()).toEqual({ position: 0, duration: 0 });
  });

  it('round-trips + notifies subscribers, stopping after unsubscribe', () => {
    const seen: number[] = [];
    const off = onCastProgressChange(() => seen.push(getCastProgress().position));
    setCastProgress({ position: 42, duration: 200 });
    expect(getCastProgress()).toEqual({ position: 42, duration: 200 });
    off();
    setCastProgress({ position: 99, duration: 200 });
    expect(seen).toEqual([42]);
  });
});
