import { describe, expect, it } from 'vitest';
import { deriveReadAlongState, unavailableCopy } from './readAlongState';
import type { ReadAlongBook } from './storytellerApi';

const book = (Status: ReadAlongBook['Status']): ReadAlongBook => ({
  Status,
  BookUuid: 'u',
  Title: 'T',
  Duration: 10,
  Parts: [],
  Chapters: [],
  Clips: [],
});

const base = {
  enabled: true,
  isAudiobook: true,
  isLoading: false,
  isError: false,
  book: undefined,
};

describe('deriveReadAlongState', () => {
  it('is unavailable (no-plugin) when the flag is off, whatever else is true', () => {
    expect(deriveReadAlongState({ ...base, enabled: false, book: book('ready') })).toEqual({
      kind: 'unavailable',
      reason: 'no-plugin',
    });
  });
  it('is unavailable (not-a-book) for music', () => {
    expect(deriveReadAlongState({ ...base, isAudiobook: false })).toEqual({
      kind: 'unavailable',
      reason: 'not-a-book',
    });
  });
  it('error beats loading and a stale book', () => {
    expect(
      deriveReadAlongState({ ...base, isError: true, isLoading: true, book: book('ready') }),
    ).toEqual({ kind: 'error' });
  });
  it('is loading while the query runs or has no data yet', () => {
    expect(deriveReadAlongState({ ...base, isLoading: true })).toEqual({ kind: 'loading' });
    expect(deriveReadAlongState({ ...base })).toEqual({ kind: 'loading' });
  });
  it("surfaces the plugin's own verdict as the unavailable reason", () => {
    for (const s of ['unlinked', 'unmatched', 'aligning', 'mismatch'] as const) {
      expect(deriveReadAlongState({ ...base, book: book(s) })).toEqual({
        kind: 'unavailable',
        reason: s,
      });
    }
  });
  it('is ready with the book when the plugin says so', () => {
    const b = book('ready');
    expect(deriveReadAlongState({ ...base, book: b })).toEqual({ kind: 'ready', book: b });
  });
});

describe('unavailableCopy', () => {
  it('points an unlinked user at Settings and nobody else', () => {
    expect(unavailableCopy('unlinked').settingsLink).toBe(true);
    for (const r of ['unmatched', 'aligning', 'mismatch', 'not-a-book', 'no-plugin'] as const) {
      const c = unavailableCopy(r);
      expect(c.settingsLink).toBe(false);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.message.length).toBeGreaterThan(0);
    }
  });
});
