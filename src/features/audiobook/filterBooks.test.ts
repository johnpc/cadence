import { describe, expect, it } from 'vitest';
import { filterBooks } from './filterBooks';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const mk = (name: string, author: string): Book => ({
  id: name,
  book: { Id: name, Name: name, Type: 'AudioBook', AlbumArtist: author } as JellyfinItem,
  title: name,
  parts: [],
});

const list = [mk('Dune', 'Frank Herbert'), mk('Sapiens', 'Yuval Noah Harari')];

describe('filterBooks', () => {
  it('returns all for an empty query', () => {
    expect(filterBooks(list, '')).toHaveLength(2);
    expect(filterBooks(list, '  ')).toHaveLength(2);
  });

  it('matches on title (case-insensitive)', () => {
    expect(filterBooks(list, 'dune').map((b) => b.book.Name)).toEqual(['Dune']);
  });

  it('matches on author', () => {
    expect(filterBooks(list, 'harari').map((b) => b.book.Name)).toEqual(['Sapiens']);
  });

  it('returns empty when nothing matches', () => {
    expect(filterBooks(list, 'zzz')).toEqual([]);
  });
});
