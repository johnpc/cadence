// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bookPath, bookPathForItem, bookSlug, parseBookRef, resolveBookRef } from './bookLink';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = (Id: string, Name: string, Album?: string): JellyfinItem => ({
  Id,
  Name,
  Album,
  Type: 'AudioBook',
});
const book = (id: string, title: string, partIds: string[] = [id]): Book => ({
  id,
  title,
  book: part(partIds[0], title, title),
  parts: partIds.map((p) => part(p, title, title)),
});

const HOG = '49614fe6d469235cfd595b6e31bd34da';
const HOG2 = 'aaaa0000d469235cfd595b6e31bd34da';
const CIRCE = '1234abcd0000000000000000000000ff';
const library: Book[] = [
  book(CIRCE, 'Circe'),
  book(HOG, 'Hogfather: Discworld, Book 20', [HOG, HOG2]),
  book('49614fe6ffff0000000000000000aaaa', 'Hogfather: Discworld, Book 20 (Graphic)'),
];

describe('bookSlug', () => {
  it('lowercases and dashes the display title', () => {
    expect(bookSlug('Hogfather: Discworld, Book 20')).toBe('hogfather-discworld-book-20');
    expect(bookSlug("The Hitchhiker's Guide to the Galaxy")).toBe(
      'the-hitchhikers-guide-to-the-galaxy',
    );
    expect(bookSlug('The Institute - A Novel')).toBe('the-institute');
    expect(bookSlug('Les Misérables (Unabridged)')).toBe('les-miserables');
    expect(bookSlug('!!!')).toBe('');
  });
});

describe('bookPath', () => {
  it('is slug + the first 8 hex of the id', () => {
    expect(bookPath('Hogfather: Discworld, Book 20', HOG)).toBe(
      '/audiobook/hogfather-discworld-book-20-49614fe6',
    );
  });
  it('falls back to the id when the title has no letters', () => {
    expect(bookPath('???', HOG)).toBe(`/audiobook/${HOG}`);
  });
  it('builds from an AudioBook item using the book title, not the part name', () => {
    expect(bookPathForItem(part(HOG2, 'Hogfather part 2', 'Hogfather: Discworld, Book 20'))).toBe(
      '/audiobook/hogfather-discworld-book-20-aaaa0000',
    );
  });
});

describe('parseBookRef', () => {
  it('reads each form', () => {
    expect(parseBookRef(HOG.toUpperCase())).toEqual({ kind: 'id', id: HOG });
    expect(parseBookRef('hogfather-49614fe6')).toEqual({
      kind: 'slug-id8',
      slug: 'hogfather',
      id8: '49614fe6',
    });
    expect(parseBookRef('Hogfather Discworld')).toEqual({
      kind: 'slug',
      slug: 'hogfather-discworld',
    });
  });
});

describe('resolveBookRef', () => {
  it('resolves a full id, including a later part of the book', () => {
    expect(resolveBookRef(HOG, library)?.id).toBe(HOG);
    expect(resolveBookRef(HOG2, library)?.id).toBe(HOG);
    expect(resolveBookRef('ffffffffffffffffffffffffffffffff', library)).toBeNull();
  });
  it('resolves a slug-id8 by a unique id prefix even when the slug is stale', () => {
    expect(resolveBookRef('circe-1234abcd', library)?.id).toBe(CIRCE);
    expect(resolveBookRef('renamed-book-1234abcd', library)?.id).toBe(CIRCE);
    expect(resolveBookRef('hogfather-discworld-book-20-aaaa0000', library)?.id).toBe(HOG);
  });
  it('breaks an ambiguous prefix with the slug', () => {
    expect(resolveBookRef('hogfather-discworld-book-20-49614fe6', library)?.id).toBe(HOG);
    expect(resolveBookRef('hogfather-discworld-book-20-graphic-49614fe6', library)?.id).toBe(
      '49614fe6ffff0000000000000000aaaa',
    );
    expect(resolveBookRef('nothing-like-it-49614fe6', library)).toBeNull();
  });
  it('falls back to the slug when no id starts with the suffix', () => {
    expect(resolveBookRef('circe-deadbeef', library)?.id).toBe(CIRCE);
  });
  it('resolves a bare slug by exact title, first in library order', () => {
    expect(resolveBookRef('hogfather-discworld-book-20', library)?.id).toBe(HOG);
    const dupes = [
      book('11111111000000000000000000000000', 'Dune'),
      book('22222222000000000000000000000000', 'Dune'),
    ];
    expect(resolveBookRef('dune', dupes)?.id).toBe('11111111000000000000000000000000');
    expect(resolveBookRef('no-such-book', library)).toBeNull();
  });
});
