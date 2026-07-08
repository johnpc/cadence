/**
 * Lyrics for a track (Jellyfin 10.9+). Returns the plain lines; timed sync is
 * available (Start ticks) but we render a simple scrollable lyric sheet. A 404
 * (no lyrics) resolves to an empty list rather than throwing.
 */
import { request, Unauthenticated } from './jellyfinFetch';

interface LyricLine {
  Text: string;
  Start?: number;
}
interface LyricsResponse {
  Lyrics?: LyricLine[];
}

/** The track's lyric lines, or [] when none exist. */
export async function getLyrics(itemId: string): Promise<string[]> {
  try {
    const res = await request<LyricsResponse>(`/Audio/${itemId}/Lyrics`);
    return (res.Lyrics ?? []).map((l) => l.Text).filter((t) => t !== undefined);
  } catch (error) {
    if (error instanceof Unauthenticated) throw error;
    return []; // 404 / no lyrics
  }
}
