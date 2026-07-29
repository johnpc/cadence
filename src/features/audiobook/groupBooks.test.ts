import { describe, expect, it } from 'vitest';
import { groupBooks, titleStem } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const file = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? over.Name ?? 'x', Name: 'x', Type: 'AudioBook', ...over }) as JellyfinItem;

describe('titleStem', () => {
  it('strips part/chapter numbers', () => {
    expect(titleStem('Home Front-Part01')).toBe('home front');
    expect(titleStem('The Stranger 03')).toBe('the stranger');
    expect(titleStem('The Little Prince - Chapter 1')).toBe('the little prince');
  });
  it('leaves a plain title untouched', () => {
    expect(titleStem('Blade Runner')).toBe('blade runner');
  });
});

describe('groupBooks', () => {
  it('groups files sharing an Album into one book, ordered by IndexNumber', () => {
    const books = groupBooks([
      file({ Id: 'c2', Name: 'Ch 2', Album: 'The Little Prince', IndexNumber: 2 }),
      file({ Id: 'c1', Name: 'Ch 1', Album: 'The Little Prince', IndexNumber: 1 }),
      file({ Id: 'c3', Name: 'Ch 3', Album: 'The Little Prince', IndexNumber: 3 }),
    ]);
    expect(books).toHaveLength(1);
    expect(books[0].parts.map((p) => p.Id)).toEqual(['c1', 'c2', 'c3']);
    expect(books[0].id).toBe('c1'); // first part is the representative
    // Title = the shared Album, NOT the first chapter's name ("Ch 1").
    expect(books[0].title).toBe('The Little Prince');
  });

  it('titles a multi-part book by its Album, not the first chapter name', () => {
    const books = groupBooks([
      file({
        Id: 'p0',
        Name: 'Preface',
        Album: 'Astrophysics for People in a Hurry',
        IndexNumber: 0,
      }),
      file({
        Id: 'p1',
        Name: 'The Greatest Story',
        Album: 'Astrophysics for People in a Hurry',
        IndexNumber: 1,
      }),
    ]);
    expect(books[0].title).toBe('Astrophysics for People in a Hurry');
  });

  it('uses the item name for a single-file book and strips (Unabridged)', () => {
    const books = groupBooks([
      file({ Id: 'c', Name: 'Circe (Unabridged)', Album: 'Circe (Unabridged)' }),
    ]);
    expect(books[0].title).toBe('Circe');
  });

  it('keeps single-file books separate', () => {
    const books = groupBooks([
      file({ Id: 'b1', Name: 'Blade Runner', Album: '01 Blade Runner' }),
      file({ Id: 'b2', Name: 'Dune', Album: '01 Dune' }),
    ]);
    expect(books).toHaveLength(2);
    expect(books.every((b) => b.parts.length === 1)).toBe(true);
  });

  it('falls back to ParentId + title stem when there is no Album', () => {
    // Two distinct loose books in the SAME folder must NOT fuse...
    const books = groupBooks([
      file({ Id: 'h1', Name: 'Home Front-Part01', ParentId: 'shared' }),
      file({ Id: 'h2', Name: 'Home Front-Part02', ParentId: 'shared' }),
      file({ Id: 'o1', Name: 'One Hundred Years of Solitude', ParentId: 'shared' }),
    ]);
    const homeFront = books.find((b) => b.book.Name.startsWith('Home Front'));
    const solitude = books.find((b) => b.book.Name.startsWith('One Hundred'));
    expect(homeFront?.parts).toHaveLength(2); // ...but a book's own parts DO group
    expect(solitude?.parts).toHaveLength(1);
    expect(books).toHaveLength(2);
  });

  it('returns an empty list for no input', () => {
    expect(groupBooks([])).toEqual([]);
  });
});
