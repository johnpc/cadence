/**
 * Types for audiobook chapters. Jellyfin 12 extracts embedded chapter markers
 * from m4b files natively (the item's `Chapters` field, in .NET ticks);
 * audiobookApi converts them to this shape — seconds — so the player and the
 * chapter helpers never touch ticks.
 */

/** A single audiobook chapter. `start` is in SECONDS from the file start, so the
 * player seeks with `audio.currentTime = start` directly (no unit conversion). */
export interface AudiobookChapter {
  name: string;
  start: number;
}
