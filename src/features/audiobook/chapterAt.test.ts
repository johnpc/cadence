import { describe, expect, it } from 'vitest';
import { chapterIndexAt } from './chapterAt';
import type { AudiobookChapter } from './audiobookTypes';

const chapters: AudiobookChapter[] = [
  { name: 'Intro', start: 0 },
  { name: 'One', start: 60 },
  { name: 'Two', start: 120 },
];

describe('chapterIndexAt', () => {
  it('returns -1 for an empty list', () => {
    expect(chapterIndexAt([], 50)).toBe(-1);
  });

  it('finds the chapter containing the position', () => {
    expect(chapterIndexAt(chapters, 0)).toBe(0);
    expect(chapterIndexAt(chapters, 59)).toBe(0);
    expect(chapterIndexAt(chapters, 60)).toBe(1);
    expect(chapterIndexAt(chapters, 200)).toBe(2);
  });

  it('returns -1 when the position precedes the first chapter', () => {
    expect(chapterIndexAt([{ name: 'Late', start: 30 }], 10)).toBe(-1);
  });
});
