import { imageUrl } from '../../lib/navidromeStream';
import type { MediaItem } from '../../lib/navidromeTypes';

/** Cover art at several sizes for the OS now-playing UI, so it picks the
 * sharpest for each surface (small lock-screen thumbnail vs. large
 * CarPlay/Control-Center art) instead of scaling one size up or down. Empty
 * when the track has no art. */
export function artworkFor(track: MediaItem): MediaImage[] {
  return [96, 192, 384, 512]
    .map((size) => ({ src: imageUrl(track, size), size }))
    .filter((a): a is { src: string; size: number } => a.src !== null)
    .map(({ src, size }) => ({ src, sizes: `${size}x${size}`, type: 'image/jpeg' }));
}
