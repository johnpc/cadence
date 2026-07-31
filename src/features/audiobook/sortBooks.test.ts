import { describe, expect, it } from 'vitest';
import { sortBooks } from './sortBooks';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const mk = (id: string, title: string, parts: Partial<JellyfinItem>[]): Book => ({
  id,
  title,
  book: { Id: id, Name: title, Type: 'AudioBook' } as JellyfinItem,
  parts: parts.map(
    (p, i) => ({ Id: `${id}-${i}`, Name: title, Type: 'AudioBook', ...p }) as JellyfinItem,
  ),
});

describe('sortBooks', () => {
  it('sorts A–Z by title, case-insensitive', () => {
    const books = [mk('b', 'banana', [{}]), mk('a', 'Apple', [{}]), mk('c', 'cherry', [{}])];
    expect(sortBooks(books, 'alpha').map((b) => b.title)).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('sorts by most recently added (DateCreated desc)', () => {
    const books = [
      mk('old', 'Old', [{ DateCreated: '2024-01-01T00:00:00Z' }]),
      mk('new', 'New', [{ DateCreated: '2026-01-01T00:00:00Z' }]),
    ];
    expect(sortBooks(books, 'added').map((b) => b.id)).toEqual(['new', 'old']);
  });

  it('uses the MAX part date for a multi-file book', () => {
    const books = [
      mk('single', 'Single', [{ DateCreated: '2025-06-01T00:00:00Z' }]),
      mk('multi', 'Multi', [
        { DateCreated: '2024-01-01T00:00:00Z' },
        { DateCreated: '2026-01-01T00:00:00Z' }, // newest part wins
      ]),
    ];
    expect(sortBooks(books, 'added').map((b) => b.id)).toEqual(['multi', 'single']);
  });

  it('sorts by most recently played (UserData.LastPlayedDate desc)', () => {
    const books = [
      mk('a', 'A', [{ UserData: { LastPlayedDate: '2026-07-01T00:00:00Z' } }]),
      mk('b', 'B', [{ UserData: { LastPlayedDate: '2026-07-30T00:00:00Z' } }]),
    ];
    expect(sortBooks(books, 'played').map((b) => b.id)).toEqual(['b', 'a']);
  });

  it('keeps never-played/keyless books in server order below the dated ones (stable)', () => {
    const books = [
      mk('none1', 'None1', [{}]),
      mk('played', 'Played', [{ UserData: { LastPlayedDate: '2026-01-01T00:00:00Z' } }]),
      mk('none2', 'None2', [{}]),
    ];
    expect(sortBooks(books, 'played').map((b) => b.id)).toEqual(['played', 'none1', 'none2']);
  });

  it('does not mutate the input array', () => {
    const books = [mk('b', 'B', [{}]), mk('a', 'A', [{}])];
    const before = books.map((b) => b.id);
    sortBooks(books, 'alpha');
    expect(books.map((b) => b.id)).toEqual(before);
  });
});
