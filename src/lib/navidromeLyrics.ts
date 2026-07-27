/**
 * Lyrics for a track (OpenSubsonic's getLyricsBySongId extension). Returns
 * structured lines; when the lyrics are synced (LRC-style) we surface each
 * line's start offset in seconds so the sheet can karaoke-highlight the
 * active line. A missing-lyrics response resolves to an empty list rather
 * than throwing.
 */
import { request, Unauthenticated } from './navidromeFetch';

interface SubsonicLyricLine {
  start?: number;
  value: string;
}
interface SubsonicStructuredLyrics {
  synced: boolean;
  line: SubsonicLyricLine[];
}

/** One lyric line. `start` is the line's offset in SECONDS when the track has
 * synced (LRC) timing, else undefined for plain (unsynced) lyrics. */
export interface LyricLine {
  text: string;
  start?: number;
}

const MS_PER_SECOND = 1000;

/** The track's lyric lines, or [] when none exist. */
export async function getLyrics(itemId: string): Promise<LyricLine[]> {
  try {
    const res = await request<{ lyricsList: { structuredLyrics?: SubsonicStructuredLyrics[] } }>(
      '/getLyricsBySongId',
      { params: { id: itemId } },
    );
    const structured = res.lyricsList.structuredLyrics?.[0];
    if (!structured) return [];
    return structured.line.map((l) => ({
      text: l.value,
      // Only positive offsets on a SYNCED entry count as timed.
      start:
        structured.synced && l.start !== undefined && l.start > 0
          ? l.start / MS_PER_SECOND
          : undefined,
    }));
  } catch (error) {
    if (error instanceof Unauthenticated) throw error;
    return []; // no lyrics for this track
  }
}
