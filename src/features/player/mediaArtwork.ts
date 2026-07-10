import { imageUrl } from '../../lib/jellyfinStream';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Cover art at several sizes for the OS now-playing UI, so it picks the
 * sharpest for each surface (small lock-screen thumbnail vs. large
 * CarPlay/Control-Center art) instead of scaling one size up or down. Empty
 * when the track has no art. */
export function artworkFor(track: JellyfinItem): MediaImage[] {
  return [96, 192, 384, 512]
    .map((size) => ({ src: imageUrl(track, size), size }))
    .filter((a): a is { src: string; size: number } => a.src !== null)
    .map(({ src, size }) => ({ src, sizes: `${size}x${size}`, type: 'image/jpeg' }));
}
