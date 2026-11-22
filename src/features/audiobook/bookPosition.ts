import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { AudiobookChapter } from './audiobookTypes';
import { chapterIndexAt } from './chapterAt';
import { bookTitle } from './bookTitle';
import { byPlayOrder, groupKey } from './groupBooks';
import { isAudiobook } from './isAudiobook';

const TICKS_PER_SECOND = 10_000_000;

/** Where the listener is within one span (the whole book, or one chapter). All
 * seconds; `position`/`duration` are relative to the span's own start, and
 * `remainingAtRate` is wall-clock time left at the current playback speed. */
export interface ProgressSpan {
  title: string;
  position: number;
  duration: number;
  remainingAtRate: number;
}

/** The chapter span, plus where it sits: `start` is GLOBAL book seconds (so a seek
 * inside the chapter is `start + s`), `index`/`count` number it within its list. */
export interface ChapterSpan extends ProgressSpan {
  start: number;
  index: number;
  count: number;
}

/** The listener's place in an audiobook, as ONE value: always the whole book,
 * and the chapter when the book has any (embedded markers, or its parts). */
export interface BookPosition {
  book: ProgressSpan;
  chapter: ChapterSpan | null;
}

/** A global book position resolved to the part that holds it. */
export interface PartTarget {
  itemId: string;
  seconds: number;
}

/** The book the current item belongs to, as the player knows it: the queued
 * audiobook items that group with it (same book key), in play order, deduped.
 * Always includes the current item. */
export function bookParts(current: JellyfinItem, queue: JellyfinItem[]): JellyfinItem[] {
  const key = groupKey(current);
  const seen = new Set<string>();
  const parts: JellyfinItem[] = [];
  for (const item of [current, ...queue]) {
    if (seen.has(item.Id) || !isAudiobook(item) || groupKey(item) !== key) continue;
    seen.add(item.Id);
    parts.push(item);
  }
  return parts.sort(byPlayOrder);
}

/** Each part's length in seconds. The playing part uses the element's live
 * duration when known (tags can be off); the others their RunTimeTicks. */
export function partDurations(
  parts: JellyfinItem[],
  currentId: string,
  liveDuration: number,
): number[] {
  return parts.map((p) =>
    p.Id === currentId && liveDuration > 0
      ? liveDuration
      : (p.RunTimeTicks ?? 0) / TICKS_PER_SECOND,
  );
}

/** Resolve a global book position to the part that holds it (clamped to the book). */
export function partAt(
  parts: JellyfinItem[],
  durations: number[],
  globalSeconds: number,
): PartTarget | null {
  if (parts.length === 0) return null;
  let offset = 0;
  for (let i = 0; i < parts.length; i++) {
    const end = offset + durations[i];
    if (globalSeconds < end || i === parts.length - 1) {
      return {
        itemId: parts[i].Id,
        seconds: Math.max(0, Math.min(globalSeconds - offset, durations[i])),
      };
    }
    offset = end;
  }
  return null;
}

function span(title: string, position: number, duration: number, rate: number): ProgressSpan {
  const p = Math.max(0, Math.min(position, duration));
  return { title, position: p, duration, remainingAtRate: (duration - p) / (rate > 0 ? rate : 1) };
}

function sameTitle(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return n(a) === n(b);
}

/** A chapter marker named only by its number ("1", "10") reads as a stray
 * digit on its own; show it as "Chapter 10". Anything else is kept as named. */
export function chapterLabel(name: string): string {
  const trimmed = name.trim();
  return /^\d{1,4}$/.test(trimmed) ? `Chapter ${Number(trimmed)}` : trimmed;
}

/** A part shown as a chapter: its own name, or "Part 2 of 3" when the part is
 * just titled with the book (common: every file carries the book's name). */
function partTitle(part: JellyfinItem, index: number, count: number, book: string): string {
  return sameTitle(part.Name, book) ? `Part ${index + 1} of ${count}` : part.Name;
}

/**
 * The listener's place in the book and in the chapter. Chapters come from the
 * playing file's embedded markers when it has them; otherwise a multi-part book's
 * parts are its chapters; a single file without markers has only the book span.
 */
export function bookPosition(input: {
  current: JellyfinItem;
  parts: JellyfinItem[];
  position: number;
  duration: number;
  chapters: AudiobookChapter[];
  rate: number;
}): BookPosition {
  const { current, parts, position, chapters, rate } = input;
  const all = parts.length > 0 ? parts : [current];
  const durations = partDurations(all, current.Id, input.duration);
  const idx = Math.max(
    0,
    all.findIndex((p) => p.Id === current.Id),
  );
  const offset = durations.slice(0, idx).reduce((a, b) => a + b, 0);
  const total = durations.reduce((a, b) => a + b, 0);
  const title = bookTitle(all[0], all.length);
  const book = span(title, offset + position, total, rate);
  if (chapters.length > 0) {
    const i = Math.max(0, chapterIndexAt(chapters, position));
    const start = chapters[i].start;
    const end = chapters[i + 1]?.start ?? durations[idx];
    const s = span(chapterLabel(chapters[i].name), position - start, end - start, rate);
    return { book, chapter: { ...s, start: offset + start, index: i, count: chapters.length } };
  }
  if (all.length > 1) {
    const s = span(partTitle(current, idx, all.length, title), position, durations[idx], rate);
    return { book, chapter: { ...s, start: offset, index: idx, count: all.length } };
  }
  return { book, chapter: null };
}
