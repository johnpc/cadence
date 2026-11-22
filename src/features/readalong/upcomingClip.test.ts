import { describe, expect, it } from 'vitest';
import { upcomingClip } from './upcomingClip';

const parts = [
  { ItemId: 'p1', Duration: 100 },
  { ItemId: 'p2', Duration: 100 },
];
const clips = [
  { Start: 42, End: 46, Chapter: 0, Fragment: 's1' },
  { Start: 46, End: 50, Chapter: 0, Fragment: 's2' },
  { Start: 150, End: 154, Chapter: 1, Fragment: 's3' },
];

describe('upcomingClip', () => {
  it('names the first sentence after the playhead and how long until it', () => {
    expect(upcomingClip(clips, parts, 'p1', 0)).toEqual({ clip: clips[0], secondsUntil: 42 });
    expect(upcomingClip(clips, parts, 'p1', 60)).toEqual({ clip: clips[2], secondsUntil: 90 });
  });
  it('works across parts on the book clock', () => {
    expect(upcomingClip(clips, parts, 'p2', 10)).toEqual({ clip: clips[2], secondsUntil: 40 });
  });
  it('is null after the last sentence or when the position cannot be placed', () => {
    expect(upcomingClip(clips, parts, 'p2', 60)).toBeNull();
    expect(upcomingClip(clips, parts, 'nope', 10)).toBeNull();
  });
});
