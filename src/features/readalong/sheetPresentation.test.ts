import { describe, expect, it } from 'vitest';
import { author, sheetPresentation } from './sheetPresentation';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongBook } from './storytellerApi';

const current: JellyfinItem = {
  Id: 'p1',
  Name: 'Part 1',
  Type: 'AudioBook',
  Album: 'Album T',
  AlbumArtist: 'Mara Quill',
};
const book: ReadAlongBook = {
  Status: 'ready',
  BookUuid: 'u',
  Title: 'The Institute - A Novel',
  Duration: 1,
  Parts: [],
  Chapters: [],
  Clips: [],
};
const base = { chapter: null, clip: null, textLoading: false, textError: false, upcoming: null };

describe('sheetPresentation', () => {
  it('titles the sheet with the cleaned book title: Storyteller, then album, then track', () => {
    expect(sheetPresentation({ ...base, state: { kind: 'ready', book }, current }).title).toBe(
      'The Institute',
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

  it('subtitles with the author — the chapter lives on the chapter bar, not up here', () => {
    const out = sheetPresentation({
      ...base,
      state: { kind: 'ready', book },
      current,
      chapter: { Href: 'c', Title: 'Ch' },
    });
    expect(out.subtitle).toBe('Mara Quill');
  });

  it('author falls back to the first artist, then nothing', () => {
    expect(author({ ...current, AlbumArtist: undefined, Artists: ['Ada'] })).toBe('Ada');
    expect(author({ ...current, AlbumArtist: undefined, Artists: [] })).toBeNull();
    expect(author(null)).toBeNull();
  });

  it('folds the state and text query into one loading / error pair', () => {
    const withClip = {
      ...base,
      current,
      chapter: { Href: 'c', Title: 'Ch' },
      clip: { Start: 0, End: 1, Chapter: 0, Fragment: 's9' },
    };
    expect(
      sheetPresentation({ ...withClip, state: { kind: 'ready', book }, textLoading: true }),
    ).toMatchObject({ isLoading: true, isError: false, activeFragment: 's9' });
    expect(sheetPresentation({ ...withClip, state: { kind: 'error' } }).isError).toBe(true);
    expect(
      sheetPresentation({ ...withClip, state: { kind: 'ready', book }, textError: true }).isError,
    ).toBe(true);
  });

  it('counts down to the upcoming sentence during a silent stretch, in the author slot', () => {
    const out = sheetPresentation({
      ...base,
      state: { kind: 'ready', book },
      current,
      chapter: { Href: 'c', Title: 'Ch' },
      upcoming: { clip: { Start: 42, End: 46, Chapter: 0, Fragment: 's2' }, secondsUntil: 41.6 },
    });
    expect(out.subtitle).toBe('Narration starts in 0:41');
    expect(out.upcomingFragment).toBe('s2');
    expect(out.activeFragment).toBeNull();
  });
});
