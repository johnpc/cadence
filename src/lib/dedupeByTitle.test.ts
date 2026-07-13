import { describe, expect, it } from 'vitest';
import { dedupeByTitle } from './dedupeByTitle';
import type { JellyfinItem } from './jellyfinTypes';

const t = (id: string, name: string): JellyfinItem => ({ Id: id, Name: name, Type: 'Audio' });

describe('dedupeByTitle', () => {
  it('collapses the same song across versions, keeping one', () => {
    const out = dedupeByTitle([t('1', 'Creep'), t('2', 'Creep (Live)'), t('3', 'No Surprises')]);
    expect(out.map((x) => x.Name)).toEqual(['Creep', 'No Surprises']);
  });

  it('prefers the studio version even when a live copy came first', () => {
    // Relevance put the live take first; the studio take should replace it in place.
    const out = dedupeByTitle([t('1', 'Banana Pancakes (live)'), t('2', 'Banana Pancakes')]);
    expect(out).toHaveLength(1);
    expect(out[0].Name).toBe('Banana Pancakes');
  });

  it('matches across " - Live" and "[Remastered]" qualifiers', () => {
    const out = dedupeByTitle([
      t('1', 'Better Together'),
      t('2', 'Better Together - Live'),
      t('3', 'Better Together [Remastered]'),
    ]);
    expect(out.map((x) => x.Name)).toEqual(['Better Together']);
  });

  it('keeps distinct songs and preserves order', () => {
    const out = dedupeByTitle([t('1', 'Yesterday'), t('2', 'In My Life'), t('3', 'Let It Be')]);
    expect(out.map((x) => x.Name)).toEqual(['Yesterday', 'In My Life', 'Let It Be']);
  });

  it('keeps the first when both are live (no studio to prefer)', () => {
    const out = dedupeByTitle([t('1', 'Creep (live)'), t('2', 'Creep (acoustic)')]);
    expect(out.map((x) => x.Id)).toEqual(['1']);
  });
});
