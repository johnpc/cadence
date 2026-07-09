/**
 * Lyrics for a track (Jellyfin 10.9+). Returns structured lines; when a line
 * carries a `Start` tick offset (LRC-style timing) we surface it in seconds so
 * the sheet can karaoke-highlight the active line. A 404 (no lyrics) resolves
 * to an empty list rather than throwing.
 */
import { request, Unauthenticated } from './jellyfinFetch';

interface RawLyricLine {
  Text?: string;
  Start?: number;
}
interface LyricsResponse {
  Lyrics?: RawLyricLine[];
}

/** One lyric line. `start` is the line's offset in SECONDS when the track has
 * synced (LRC) timing, else undefined for plain (unsynced) lyrics. */
export interface LyricLine {
  text: string;
  start?: number;
}

const TICKS_PER_SECOND = 10_000_000;

/** The track's lyric lines, or [] when none exist. */
export async function getLyrics(itemId: string): Promise<LyricLine[]> {
  try {
    const res = await request<LyricsResponse>(`/Audio/${itemId}/Lyrics`);
    return (res.Lyrics ?? [])
      .filter((l) => l.Text !== undefined)
      .map((l) => ({
        text: l.Text as string,
        // Only positive offsets count as timed — plain lyrics report no Start.
        start: l.Start && l.Start > 0 ? l.Start / TICKS_PER_SECOND : undefined,
      }));
  } catch (error) {
    if (error instanceof Unauthenticated) throw error;
    return []; // 404 / no lyrics
  }
}
