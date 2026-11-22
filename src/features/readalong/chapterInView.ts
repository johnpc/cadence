import { activeClipIndex, toGlobalSeconds } from './timeline';
import { upcomingClip } from './upcomingClip';
import type { ReadAlongBook, ReadAlongChapter, ReadAlongClip } from './storytellerApi';

/** A sentence stays "narrated" this long past its clip end — the breath between
 * sentences, and whisper's slightly early clip ends. Beyond it the stretch is
 * silence (music, a pause between chapters) and the NEXT sentence is pointed at. */
export const SILENCE_GRACE_SECONDS = 5;

/**
 * Which chapter the sheet shows, which sentence is narrated right now, and —
 * during a silent stretch — which sentence comes next and in how long. The
 * chapter follows the narrated clip, else the upcoming one (so intro music
 * shows the chapter about to be read, not the title page). Pure: the hook just
 * feeds it the live inputs.
 */
export function chapterInView(
  book: ReadAlongBook | null,
  currentItemId: string | undefined,
  positionSeconds: number,
): {
  clip: ReadAlongClip | null;
  upcoming: { clip: ReadAlongClip; secondsUntil: number } | null;
  chapterIndex: number;
  chapter: ReadAlongChapter | null;
} {
  if (!book || !currentItemId)
    return { clip: null, upcoming: null, chapterIndex: 0, chapter: null };
  const active = activeClipIndex(book.Clips, book.Parts, currentItemId, positionSeconds);
  const global = toGlobalSeconds(book.Parts, currentItemId, positionSeconds) ?? 0;
  const started = active >= 0 ? book.Clips[active] : null;
  const next = upcomingClip(book.Clips, book.Parts, currentItemId, positionSeconds);
  // A started sentence counts as narrated until a little past its end — unless
  // we're well into silence with another sentence ahead.
  const silent = started !== null && next !== null && global > started.End + SILENCE_GRACE_SECONDS;
  const clip = silent ? null : started;
  const upcoming = clip ? null : next;
  const chapterIndex = clip?.Chapter ?? upcoming?.clip.Chapter ?? 0;
  return { clip, upcoming, chapterIndex, chapter: book.Chapters[chapterIndex] ?? null };
}
