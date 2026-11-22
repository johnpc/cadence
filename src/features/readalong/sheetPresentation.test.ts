import { describe, expect, it } from 'vitest';
import { chapterLine, sheetPresentation } from './sheetPresentation';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongBook } from './storytellerApi';

const current: JellyfinItem = { Id: 'p1', Name: 'Part 1', Type: 'AudioBook', Album: 'Album T' };
const book: ReadAlongBook = {
  Status: 'ready',
  BookUuid: 'u',
  Title: 'Book T',
  Duration: 1,
  Parts: [],
  Chapters: [],
  Clips: [],
};

describe('sheetPresentation', () => {
  it('prefers the Storyteller title, then the album, then the track name', () => {
    const base = {
      chapter: null,
      clip: null,
      textLoading: false,
      textError: false,
      playheadChapter: null,
      chapterRemaining: null,
      upcoming: null,
    };
    expect(sheetPresentation({ ...base, state: { kind: 'ready', book }, current }).title).toBe(
      'Book T',
    );
    expect(sheetPresentation({ ...base, state: { kind: 'loading' }, current }).title).toBe(
      'Album T',
    );
    expect(
      sheetPresentation({
        ...base,
        state: { kind: 'loading' },
        current: { ...current, Album: undefined },
      }).title,
    ).toBe('Part 1');
    expect(sheetPresentation({ ...base, state: { kind: 'loading' }, current: null }).title).toBe(
      '',
    );
  });
  it('folds the state and text query into one loading / error pair', () => {
    const base = {
      current,
      playheadChapter: null,
      chapterRemaining: null,
      upcoming: null,
      chapter: { Href: 'c', Title: 'Ch' },
      clip: { Start: 0, End: 1, Chapter: 0, Fragment: 's9' },
    };
    const ready = sheetPresentation({
      ...base,
      state: { kind: 'ready', book },
      textLoading: true,
      textError: false,
    });
    expect(ready).toMatchObject({
      isLoading: true,
      isError: false,
      chapterTitle: 'Ch',
      activeFragment: 's9',
    });
    const err = sheetPresentation({
      ...base,
      state: { kind: 'error' },
      textLoading: false,
      textError: false,
    });
    expect(err.isError).toBe(true);
    const textErr = sheetPresentation({
      ...base,
      state: { kind: 'ready', book },
      textLoading: false,
      textError: true,
    });
    expect(textErr.isError).toBe(true);
  });

  it("chapterLine says where the listener is: the m4b chapter with time left, else Storyteller's title", () => {
    expect(chapterLine('Chapter 3', 'Three', '12m left')).toBe('Chapter 3 · 12m left');
    expect(chapterLine('Chapter 3', null, null)).toBe('Chapter 3');
    expect(chapterLine(null, 'Three', '12m left')).toBe('Three');
    expect(chapterLine(null, null, null)).toBeNull();
  });

  it('counts down to the upcoming sentence during a silent stretch', () => {
    const out = sheetPresentation({
      state: { kind: 'ready', book },
      current,
      chapter: { Href: 'c', Title: 'Ch' },
      clip: null,
      textLoading: false,
      textError: false,
      playheadChapter: 'Opening Credits',
      chapterRemaining: '1m left',
      upcoming: { clip: { Start: 42, End: 46, Chapter: 0, Fragment: 's2' }, secondsUntil: 41.6 },
    });
    expect(out.chapterTitle).toBe('Narration starts in 0:41');
    expect(out.upcomingFragment).toBe('s2');
    expect(out.activeFragment).toBeNull();
  });
});
