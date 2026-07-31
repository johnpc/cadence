import type { Book } from './groupBooks';

/** Which part to resume a book at: the FIRST part that isn't finished (not
 * `Played`), so a listener picks up on the earliest unfinished chapter. Falls
 * back to 0 when every part is finished or none has progress. Pure + testable. */
export function resumePartIndex(book: Book): number {
  const idx = book.parts.findIndex((p) => !p.UserData?.Played);
  return idx === -1 ? 0 : idx;
}
