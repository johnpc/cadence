import { describe, expect, it } from 'vitest';
import { isAudiobook } from './isAudiobook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('isAudiobook', () => {
  it('is true for an AudioBook item', () => {
    expect(isAudiobook({ Id: 'b', Name: 'Book', Type: 'AudioBook' } as JellyfinItem)).toBe(true);
  });

  it('is false for music and other types', () => {
    expect(isAudiobook({ Id: 'a', Name: 'Song', Type: 'Audio' } as JellyfinItem)).toBe(false);
  });

  it('is false for null/undefined', () => {
    expect(isAudiobook(null)).toBe(false);
    expect(isAudiobook(undefined)).toBe(false);
  });
});
