import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({
  imageUrl: (item: { Id: string }, size: number) => (item.Id ? `art:${item.Id}:${size}` : null),
}));

import { artworkFor } from './mediaArtwork';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (over: Partial<JellyfinItem> = {}): JellyfinItem => ({
  Id: 't1',
  Name: 'x',
  Type: 'Audio',
  ...over,
});

describe('artworkFor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the four standard sizes with matching src + type', () => {
    expect(artworkFor(track())).toEqual([
      { src: 'art:t1:96', sizes: '96x96', type: 'image/jpeg' },
      { src: 'art:t1:192', sizes: '192x192', type: 'image/jpeg' },
      { src: 'art:t1:384', sizes: '384x384', type: 'image/jpeg' },
      { src: 'art:t1:512', sizes: '512x512', type: 'image/jpeg' },
    ]);
  });

  it('is empty when the track has no art (imageUrl returns null)', () => {
    expect(artworkFor(track({ Id: '' }))).toEqual([]);
  });
});
