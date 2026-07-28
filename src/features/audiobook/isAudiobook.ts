import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Whether an item is an audiobook (Jellyfin `Type: "AudioBook"`), which drives
 * chapter fetching + the chapter UI. Pure + null-safe so callers stay terse. */
export function isAudiobook(item: JellyfinItem | null | undefined): boolean {
  return item?.Type === 'AudioBook';
}
