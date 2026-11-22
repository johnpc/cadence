import { describe, expect, it } from 'vitest';
import { chapterInView } from './chapterInView';
import type { ReadAlongBook } from './storytellerApi';

const book: ReadAlongBook = {
  Status: 'ready',
  BookUuid: 'u',
  Title: 'T',
  Duration: 100,
  Parts: [{ ItemId: 'p1', Duration: 100 }],
  Chapters: [
    { Href: 'c1.xhtml', Title: 'One' },
    { Href: 'c2.xhtml', Title: 'Two' },
  ],
  Clips: [
    { Start: 2, End: 4, Chapter: 0, Fragment: 's1' },
    { Start: 50, End: 54, Chapter: 1, Fragment: 's2' },
  ],
};

describe('chapterInView', () => {
  it('before narration starts, shows the chapter about to be read with the upcoming sentence and a countdown', () => {
    expect(chapterInView(book, 'p1', 0)).toEqual({
      clip: null,
      upcoming: { clip: book.Clips[0], secondsUntil: 2 },
      chapterIndex: 0,
      chapter: book.Chapters[0],
    });
    // A silent stretch between chapters points at the next chapter's first sentence.
    const gap = chapterInView(book, 'p1', 20);
    expect(gap.clip).toBeNull();
    expect(gap.upcoming).toEqual({ clip: book.Clips[1], secondsUntil: 30 });
    expect(gap.chapterIndex).toBe(1);
  });
  it('follows the narrated clip into its chapter', () => {
    const v = chapterInView(book, 'p1', 51);
    expect(v.clip?.Fragment).toBe('s2');
    expect(v.chapterIndex).toBe(1);
    expect(v.chapter?.Title).toBe('Two');
  });
  it('is empty without a book or a current track', () => {
    expect(chapterInView(null, 'p1', 10)).toEqual({
      clip: null,
      upcoming: null,
      chapterIndex: 0,
      chapter: null,
    });
    expect(chapterInView(book, undefined, 10)).toEqual({
      clip: null,
      upcoming: null,
      chapterIndex: 0,
      chapter: null,
    });
  });
});
