import { describe, expect, it } from 'vitest';
import { highlightBooks } from './highlightBooks';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = (id: string, name = id): JellyfinItem =>
  ({ Id: id, Name: name, Type: 'AudioBook' }) as JellyfinItem;
const book = (id: string, title: string, partIds: string[]): Book => ({
  id,
  book: part(partIds[0]),
  title,
  parts: partIds.map((p) => part(p)),
});

const astro = book('a1', 'Astrophysics', ['a1', 'a2', 'a3']); // a2 = "Preface"
const calypso = book('c1', 'Calypso', ['c1']);
const grouped = [astro, calypso];

describe('highlightBooks', () => {
  it('maps a chapter-part highlight to its grouped book', () => {
    // "Preface" (a2) is a part of Astrophysics — the highlight should be the book.
    const out = highlightBooks([part('a2', 'Preface')], grouped);
    expect(out.map((b) => b.title)).toEqual(['Astrophysics']);
  });

  it('preserves highlight order and dedupes by book', () => {
    const out = highlightBooks([part('c1'), part('a2'), part('a3')], grouped);
    // Calypso first, then Astrophysics once (a2 and a3 are the same book).
    expect(out.map((b) => b.title)).toEqual(['Calypso', 'Astrophysics']);
  });

  it('drops highlights that map to no grouped book', () => {
    expect(highlightBooks([part('stale')], grouped)).toEqual([]);
  });

  it('returns empty for no highlights', () => {
    expect(highlightBooks([], grouped)).toEqual([]);
  });
});
