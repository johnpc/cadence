import { describe, expect, it } from 'vitest';
import { GENRES, findGenre } from './genres';

describe('genres catalog', () => {
  it('exposes curated genres with a name and colour', () => {
    expect(GENRES.length).toBeGreaterThan(8);
    for (const g of GENRES) {
      expect(g.name).toBeTruthy();
      expect(g.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('has no duplicate genre names', () => {
    const names = GENRES.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('findGenre matches case-insensitively', () => {
    expect(findGenre('pop')?.name).toBe('Pop');
    expect(findGenre('HIP-HOP')?.name).toBe('Hip-Hop');
  });

  it('findGenre returns undefined for an unknown genre', () => {
    expect(findGenre('Polka')).toBeUndefined();
  });
});
