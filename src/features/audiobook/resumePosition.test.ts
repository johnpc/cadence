import { describe, expect, it } from 'vitest';
import { resumeSeconds } from './resumePosition';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000; // ticks per second
const book = (over: Partial<JellyfinItem['UserData']> = {}): JellyfinItem =>
  ({ Id: 'b', Name: 'Book', Type: 'AudioBook', UserData: { ...over } }) as JellyfinItem;

describe('resumeSeconds', () => {
  it('returns the saved position for an in-progress audiobook', () => {
    expect(resumeSeconds(book({ PlaybackPositionTicks: 3600 * S }), 36000)).toBe(3600);
  });

  it('is null for a music track', () => {
    const song = {
      Id: 's',
      Name: 'S',
      Type: 'Audio',
      UserData: { PlaybackPositionTicks: 3600 * S },
    };
    expect(resumeSeconds(song as JellyfinItem, 36000)).toBeNull();
  });

  it('is null when barely started (< 5s)', () => {
    expect(resumeSeconds(book({ PlaybackPositionTicks: 2 * S }), 36000)).toBeNull();
  });

  it('is null with no saved position', () => {
    expect(resumeSeconds(book({}), 36000)).toBeNull();
  });

  it('is null when marked played', () => {
    expect(
      resumeSeconds(book({ PlaybackPositionTicks: 3600 * S, Played: true }), 36000),
    ).toBeNull();
  });

  it('is null when within the end margin (finished)', () => {
    // 5s from the end of a 100s book → start over, not resume.
    expect(resumeSeconds(book({ PlaybackPositionTicks: 95 * S }), 100)).toBeNull();
  });

  it('is null for null/undefined items', () => {
    expect(resumeSeconds(null, 100)).toBeNull();
    expect(resumeSeconds(undefined, 100)).toBeNull();
  });
});
