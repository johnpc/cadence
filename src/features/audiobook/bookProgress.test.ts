import { describe, expect, it } from 'vitest';
import { bookProgress } from './bookProgress';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const SEC = 10_000_000; // ticks per second
const part = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: 'p', Name: 'p', Type: 'AudioBook', ...over }) as JellyfinItem;
const mk = (parts: JellyfinItem[]): Book => ({ id: 'b', book: parts[0], title: 't', parts });

describe('bookProgress', () => {
  it('reports fraction + listened/remaining for a partly-heard single-file book', () => {
    // 1000s book, 250s in.
    const p = bookProgress(
      mk([part({ RunTimeTicks: 1000 * SEC, UserData: { PlaybackPositionTicks: 250 * SEC } })]),
    );
    expect(p.fraction).toBeCloseTo(0.25);
    expect(p.listenedSeconds).toBeCloseTo(250);
    expect(p.remainingSeconds).toBeCloseTo(750);
    expect(p.completed).toBe(false);
    expect(p.started).toBe(true);
  });

  it('sums progress across parts (played parts count full)', () => {
    const p = bookProgress(
      mk([
        part({ RunTimeTicks: 100 * SEC, UserData: { Played: true } }), // full 100
        part({ RunTimeTicks: 100 * SEC, UserData: { PlaybackPositionTicks: 50 * SEC } }), // 50
      ]),
    );
    expect(p.listenedSeconds).toBeCloseTo(150);
    expect(p.fraction).toBeCloseTo(0.75); // 150 / 200
    expect(p.completed).toBe(false);
  });

  it('is completed (fraction 1) when every part is played', () => {
    const p = bookProgress(
      mk([
        part({ RunTimeTicks: 100 * SEC, UserData: { Played: true } }),
        part({ RunTimeTicks: 100 * SEC, UserData: { Played: true } }),
      ]),
    );
    expect(p.completed).toBe(true);
    expect(p.fraction).toBe(1);
    expect(p.remainingSeconds).toBe(0);
  });

  it('is un-started with no UserData', () => {
    const p = bookProgress(mk([part({ RunTimeTicks: 100 * SEC })]));
    expect(p.started).toBe(false);
    expect(p.fraction).toBe(0);
  });

  it('falls back to played-parts share when runtimes are unknown', () => {
    const p = bookProgress(
      mk([part({ UserData: { Played: true } }), part({})]), // 1 of 2 played, no runtimes
    );
    expect(p.fraction).toBeCloseTo(0.5);
  });
});
