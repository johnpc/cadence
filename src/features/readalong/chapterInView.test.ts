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
  it('shows the first chapter with no highlight before narration starts', () => {
    expect(chapterInView(book, 'p1', 0)).toEqual({
      clip: null,
      chapterIndex: 0,
      chapter: book.Chapters[0],
    });
  });
  it('follows the narrated clip into its chapter', () => {
    const v = chapterInView(book, 'p1', 51);
    expect(v.clip?.Fragment).toBe('s2');
    expect(v.chapterIndex).toBe(1);
    expect(v.chapter?.Title).toBe('Two');
  });
  it('is empty without a book or a current track', () => {
    expect(chapterInView(null, 'p1', 10)).toEqual({ clip: null, chapterIndex: 0, chapter: null });
    expect(chapterInView(book, undefined, 10)).toEqual({
      clip: null,
      chapterIndex: 0,
      chapter: null,
    });
  });
});
