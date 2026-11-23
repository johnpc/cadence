import { durationWords } from '../player/playerFormat';
import { hoursMinutes } from './bookProgressLabel';
import type { Book } from './groupBooks';

/** A labelled fact for the book detail info block (e.g. "Length" → "12 hr 4 min"). */
export interface BookFact {
  label: string;
  value: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format an ISO date as "Aug 7, 2026" using UTC parts (timezone-stable, so the
 * day never shifts across environments), or '' when absent/unparseable. */
export function formatBookDate(iso: string | undefined): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** The book's total run time across all parts, as words ("12 hr 4 min"), or ''
 * when no part reports a duration. */
function bookLength(book: Book): string {
  const ticks = book.parts.reduce((sum, p) => sum + (p.RunTimeTicks ?? 0), 0);
  if (ticks <= 0) return '';
  return durationWords(Math.round(ticks / 10_000_000 / 60));
}

/** The book header's one meta line — "12h 9m · 3 parts · 65% · 4h 14m left", in
 * the same compact units as the progress — each piece omitted when unknown or
 * uninteresting (a single part, not started yet). */
export function bookHeaderMeta(book: Book, progressLabel: string | null): string {
  const ticks = book.parts.reduce((sum, p) => sum + (p.RunTimeTicks ?? 0), 0);
  const length = ticks > 0 ? hoursMinutes(ticks / 10_000_000) : '';
  const parts = book.parts.length > 1 ? `${book.parts.length} parts` : '';
  return [length, parts, progressLabel ?? ''].filter(Boolean).join(' · ');
}

/** The detail-page facts for a book: length, part count, release year, and when
 * it was added to the server — each omitted when unknown. Pure + unit-testable. */
export function bookFacts(book: Book): BookFact[] {
  const facts: BookFact[] = [];
  const length = bookLength(book);
  if (length) facts.push({ label: 'Length', value: length });
  // A single-file book has nothing to say about parts (the header doesn't either).
  if (book.parts.length > 1) facts.push({ label: 'Parts', value: String(book.parts.length) });
  if (book.book.ProductionYear) {
    facts.push({ label: 'Year', value: String(book.book.ProductionYear) });
  }
  const added = formatBookDate(book.book.DateCreated);
  if (added) facts.push({ label: 'Added', value: added });
  return facts;
}
