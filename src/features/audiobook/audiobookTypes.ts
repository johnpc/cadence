/**
 * Types for audiobook chapters served by the CadenceConfig Jellyfin plugin
 * (GET /Cadence/Audiobooks/{itemId}/Chapters). Jellyfin recognises m4b files as
 * audiobooks but doesn't expose their embedded chapter markers on its own API —
 * the plugin runs ffprobe and returns them here.
 */

/** A single audiobook chapter. `start` is in SECONDS from the file start, so the
 * player seeks with `audio.currentTime = start` directly (no unit conversion). */
export interface AudiobookChapter {
  name: string;
  start: number;
}
