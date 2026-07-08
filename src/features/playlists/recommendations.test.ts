import { describe, expect, it } from 'vitest';
import { selectRecommendations, REC_VISIBLE } from './recommendations';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: `Track ${id}`, Type: 'Audio' });

describe('selectRecommendations', () => {
  it('excludes tracks already in the playlist and dismissed/added ones', () => {
    const candidates = [t('a'), t('b'), t('c'), t('d')];
    const out = selectRecommendations(candidates, new Set(['a']), new Set(['c']));
    expect(out.map((x) => x.Id)).toEqual(['b', 'd']);
  });

  it('de-duplicates repeated candidate ids', () => {
    const out = selectRecommendations([t('a'), t('a'), t('b')], new Set(), new Set());
    expect(out.map((x) => x.Id)).toEqual(['a', 'b']);
  });

  it('caps the list to the visible limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => t(String(i)));
    expect(selectRecommendations(many, new Set(), new Set())).toHaveLength(REC_VISIBLE);
  });

  it('skips candidates without an id', () => {
    const out = selectRecommendations(
      [{ Name: 'no id', Type: 'Audio' } as JellyfinItem, t('a')],
      new Set(),
      new Set(),
    );
    expect(out.map((x) => x.Id)).toEqual(['a']);
  });
});
