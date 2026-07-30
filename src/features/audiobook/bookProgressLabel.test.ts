import { describe, expect, it } from 'vitest';
import { bookProgressLabel, hoursMinutes } from './bookProgressLabel';
import type { BookProgress } from './bookProgress';

const p = (over: Partial<BookProgress>): BookProgress => ({
  fraction: 0,
  listenedSeconds: 0,
  remainingSeconds: 0,
  completed: false,
  started: false,
  ...over,
});

describe('hoursMinutes', () => {
  it('formats hours + minutes', () => {
    expect(hoursMinutes(3 * 3600 + 10 * 60)).toBe('3h 10m');
  });
  it('formats sub-hour as minutes only', () => {
    expect(hoursMinutes(12 * 60)).toBe('12m');
  });
});

describe('bookProgressLabel', () => {
  it('says Finished when completed', () => {
    expect(bookProgressLabel(p({ completed: true }))).toBe('Finished');
  });
  it('shows percent + time left once started', () => {
    expect(
      bookProgressLabel(p({ started: true, fraction: 0.42, remainingSeconds: 3 * 3600 })),
    ).toBe('42% · 3h 0m left');
  });
  it('is null before any listening', () => {
    expect(bookProgressLabel(p({}))).toBeNull();
  });
});
