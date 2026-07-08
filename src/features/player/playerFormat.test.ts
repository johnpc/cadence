import { describe, expect, it } from 'vitest';
import { artistLine, collectionSummary, formatTime, trackDuration } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('trackDuration', () => {
  it('converts .NET ticks to m:ss', () => {
    expect(trackDuration(75 * 10_000_000)).toBe('1:15'); // 75s
    expect(trackDuration(2_000_000_000)).toBe('3:20'); // 200s
  });
  it('returns empty for missing/zero ticks', () => {
    expect(trackDuration(undefined)).toBe('');
    expect(trackDuration(0)).toBe('');
  });
});

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

describe('collectionSummary', () => {
  const t = (ticks?: number): JellyfinItem => ({
    Id: 'x',
    Name: 'x',
    Type: 'Audio',
    RunTimeTicks: ticks,
  });
  it('summarizes count and total minutes', () => {
    // two tracks of 200s + 100s = 300s = 5 min
    expect(collectionSummary([t(2_000_000_000), t(1_000_000_000)])).toBe('2 songs • 5 min');
  });
  it('uses the singular for one song', () => {
    expect(collectionSummary([t(1_800_000_000)])).toBe('1 song • 3 min');
  });
  it('drops the duration when unknown', () => {
    expect(collectionSummary([t(), t()])).toBe('2 songs');
  });
  it('is "0 songs" for an empty collection', () => {
    expect(collectionSummary([])).toBe('0 songs');
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
