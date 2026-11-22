import { describe, expect, it } from 'vitest';
import { adjacentChapter } from './adjacentChapter';

const chapters = [
  { name: 'Dedication', start: 0 },
  { name: 'Chapter 1', start: 168 },
  { name: 'Chapter 2', start: 900 },
];

describe('adjacentChapter', () => {
  it('next goes to the following chapter, and null in the last one', () => {
    expect(adjacentChapter(chapters, 10, 'next')).toBe(168);
    expect(adjacentChapter(chapters, 500, 'next')).toBe(900);
    expect(adjacentChapter(chapters, 950, 'next')).toBeNull();
  });

  it('previous restarts the chapter when more than 3 s in, else goes back one', () => {
    expect(adjacentChapter(chapters, 500, 'previous')).toBe(168);
    expect(adjacentChapter(chapters, 170, 'previous')).toBe(0);
    expect(adjacentChapter(chapters, 2, 'previous')).toBe(0);
  });

  it('is null without chapters or before the first one', () => {
    expect(adjacentChapter([], 100, 'next')).toBeNull();
    expect(adjacentChapter([{ name: 'One', start: 60 }], 10, 'previous')).toBeNull();
  });
});
