import { describe, expect, it } from 'vitest';
import { overlayProgress } from './overlayProgress';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, ticks?: number): JellyfinItem =>
  ({
    Id: id,
    Name: id,
    Type: 'AudioBook',
    UserData: { PlaybackPositionTicks: ticks },
  }) as JellyfinItem;

describe('overlayProgress', () => {
  it('returns the cached list unchanged when there are no live items', () => {
    const cached = [item('a', 5), item('b')];
    expect(overlayProgress(cached, [])).toBe(cached);
  });

  it('splices fresh UserData onto matching cached items (by id)', () => {
    const cached = [item('a', 10), item('b', 0)];
    const live = [item('a', 900)];
    const out = overlayProgress(cached, live);
    expect(out[0].UserData?.PlaybackPositionTicks).toBe(900); // fresh
    expect(out[1].UserData?.PlaybackPositionTicks).toBe(0); // untouched
  });

  it('keeps every non-UserData field from the cached copy', () => {
    const cached = [{ Id: 'a', Name: 'Dune', Type: 'AudioBook', RunTimeTicks: 42 } as JellyfinItem];
    const live = [
      { Id: 'a', Name: 'STALE', Type: 'AudioBook', UserData: { Played: true } } as JellyfinItem,
    ];
    const out = overlayProgress(cached, live);
    expect(out[0].Name).toBe('Dune'); // cached title wins
    expect(out[0].RunTimeTicks).toBe(42);
    expect(out[0].UserData?.Played).toBe(true); // only UserData taken from live
  });

  it('ignores live items with no cached match', () => {
    const cached = [item('a', 1)];
    const out = overlayProgress(cached, [item('ghost', 99)]);
    expect(out).toHaveLength(1);
    expect(out[0].Id).toBe('a');
  });
});
