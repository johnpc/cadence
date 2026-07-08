import { describe, expect, it } from 'vitest';
import { artistLine, formatTime } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('formatTime', () => {
  it('formats m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(600)).toBe('10:00');
  });

  it('clamps NaN / negatives', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('artistLine', () => {
  const base: JellyfinItem = { Id: '1', Name: 'x', Type: 'Audio' };
  it('joins artists', () => {
    expect(artistLine({ ...base, Artists: ['A', 'B'] })).toBe('A, B');
  });
  it('falls back to the album artist', () => {
    expect(artistLine({ ...base, AlbumArtist: 'C' })).toBe('C');
  });
  it('is empty for null / no artist', () => {
    expect(artistLine(null)).toBe('');
    expect(artistLine(base)).toBe('');
  });
});
