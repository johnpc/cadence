import { activeClipIndex } from './timeline';
import type { ReadAlongBook, ReadAlongChapter, ReadAlongClip } from './storytellerApi';

/** Which chapter the sheet shows and which sentence is narrated right now.
 * Before the first sentence (or for a non-part track) the first chapter shows
 * with nothing highlighted. Pure: the hook just feeds it the live inputs. */
export function chapterInView(
  book: ReadAlongBook | null,
  currentItemId: string | undefined,
  positionSeconds: number,
): { clip: ReadAlongClip | null; chapterIndex: number; chapter: ReadAlongChapter | null } {
  if (!book || !currentItemId) return { clip: null, chapterIndex: 0, chapter: null };
  const active = activeClipIndex(book.Clips, book.Parts, currentItemId, positionSeconds);
  const clip = active >= 0 ? book.Clips[active] : null;
  const chapterIndex = clip ? clip.Chapter : 0;
  return { clip, chapterIndex, chapter: book.Chapters[chapterIndex] ?? null };
}
