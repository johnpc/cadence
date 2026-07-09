import { describe, expect, it } from 'vitest';
import { songMetaLine, clampText } from './songMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const base: JellyfinItem = { Id: 's1', Name: 'Song', Type: 'Audio' };

describe('songMetaLine', () => {
  it('joins year and duration with a dot', () => {
    expect(songMetaLine({ ...base, ProductionYear: 1985, RunTimeTicks: 1_800_000_000 })).toBe(
      '1985 · 3:00',
    );
  });

  it('shows only the duration when the year is unknown', () => {
    expect(songMetaLine({ ...base, RunTimeTicks: 1_800_000_000 })).toBe('3:00');
  });

  it('shows only the year when there is no duration', () => {
    expect(songMetaLine({ ...base, ProductionYear: 1999 })).toBe('1999');
  });

  it('is empty when neither is known', () => {
    expect(songMetaLine(base)).toBe('');
  });

  it('is empty for a null song', () => {
    expect(songMetaLine(null)).toBe('');
  });
});

describe('clampText', () => {
  it('leaves short text unchanged', () => {
    expect(clampText('short bio', 160)).toBe('short bio');
  });

  it('trims surrounding whitespace', () => {
    expect(clampText('  padded  ', 160)).toBe('padded');
  });

  it('cuts on a word boundary and appends an ellipsis', () => {
    expect(clampText('one two three four five', 12)).toBe('one two…');
  });

  it('hard-cuts a single very long word', () => {
    expect(clampText('supercalifragilistic', 5)).toBe('super…');
  });
});
