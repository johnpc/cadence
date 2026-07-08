import { describe, expect, it } from 'vitest';
import { dedupeTracks } from './dedupeTracks';
import type { JellyfinItem } from './jellyfinTypes';

const t = (over: Partial<JellyfinItem>): JellyfinItem => ({
  Id: Math.random().toString(36),
  Name: 'X',
  Type: 'Audio',
  ...over,
});

describe('dedupeTracks', () => {
  it('collapses duplicate track numbers, keeping the first', () => {
    const a = t({ Id: 'a', Name: 'Song', IndexNumber: 1 });
    const dup = t({ Id: 'a2', Name: 'Song (alt)', IndexNumber: 1 });
    const b = t({ Id: 'b', Name: 'Next', IndexNumber: 2 });
    const out = dedupeTracks([a, dup, b]);
    expect(out.map((x) => x.Id)).toEqual(['a', 'b']);
  });

  it('separates track numbers across discs', () => {
    const d1 = t({ Id: 'd1', IndexNumber: 1, ParentIndexNumber: 1 });
    const d2 = t({ Id: 'd2', IndexNumber: 1, ParentIndexNumber: 2 });
    expect(dedupeTracks([d1, d2]).map((x) => x.Id)).toEqual(['d1', 'd2']);
  });

  it('falls back to name when there is no track number', () => {
    const a = t({ Id: 'a', Name: 'Same' });
    const dup = t({ Id: 'a2', Name: 'same' });
    const c = t({ Id: 'c', Name: 'Other' });
    expect(dedupeTracks([a, dup, c]).map((x) => x.Id)).toEqual(['a', 'c']);
  });

  it('preserves order and passes through a clean list unchanged', () => {
    const list = [t({ Id: '1', IndexNumber: 1 }), t({ Id: '2', IndexNumber: 2 })];
    expect(dedupeTracks(list).map((x) => x.Id)).toEqual(['1', '2']);
  });
});
