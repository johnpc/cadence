import { describe, expect, it } from 'vitest';
import { formatRemaining, remaining } from './chapterProgress';
import type { AudiobookChapter } from './audiobookTypes';

const chapters: AudiobookChapter[] = [
  { name: 'One', start: 0 },
  { name: 'Two', start: 600 },
  { name: 'Three', start: 1200 },
];

describe('formatRemaining', () => {
  it('shows seconds under a minute', () => {
    expect(formatRemaining(45)).toBe('45s left');
  });
  it('shows minutes under an hour', () => {
    expect(formatRemaining(15 * 60)).toBe('15m left');
  });
  it('shows hours and minutes', () => {
    expect(formatRemaining(7 * 3600 + 12 * 60)).toBe('7h 12m left');
  });
  it('clamps negatives to 0', () => {
    expect(formatRemaining(-5)).toBe('0s left');
  });
});

describe('remaining', () => {
  it('reports time left in the current chapter and the whole book', () => {
    // At 300s: chapter Two starts at 600 → 300s left in ch One; book is 3600 long.
    const r = remaining(chapters, 300, 3600);
    expect(r.chapter).toBe('5m left');
    expect(r.book).toBe('55m left');
  });

  it('uses the book end for the last chapter', () => {
    const r = remaining(chapters, 1300, 1800); // in ch Three (1200→end 1800)
    expect(r.chapter).toBe('8m left'); // 500s ≈ 8m
  });

  it('returns null chapter when there are no chapters', () => {
    const r = remaining([], 300, 3600);
    expect(r.chapter).toBeNull();
    expect(r.book).toBe('55m left');
  });

  it('scales remaining by playback speed', () => {
    // 55 media-min left; at 2× that's ~27m of wall-clock, chapter 5m → ~2-3m.
    const r = remaining(chapters, 300, 3600, 2);
    expect(r.book).toBe('28m left'); // round(3300/2/60) = 28
    expect(r.chapter).toBe('3m left'); // round(300/2/60) = 3 (2.5 → 3)
  });

  it('treats a non-positive rate as 1×', () => {
    expect(remaining(chapters, 300, 3600, 0).book).toBe('55m left');
  });
});
