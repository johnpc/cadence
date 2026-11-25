import { bookTitle, displayTitle } from './bookTitle';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Readable book links: `/audiobook/<slug>-<id8>`, e.g.
 * `/audiobook/hogfather-discworld-book-20-49614fe6`. The slug is for people (it
 * reads in a chat bubble); the 8-hex suffix is what resolves the book, so a
 * retitled book still opens. The route also takes the full 32-hex id (every link
 * shared before this) and a bare slug (`/audiobook/hogfather-discworld-book-20`).
 */

/** "Hogfather: Discworld, Book 20" → "hogfather-discworld-book-20". */
export function bookSlug(title: string): string {
  return displayTitle(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The readable path for a book, from its title and (group or part) id. */
export function bookPath(title: string, id: string): string {
  const slug = bookSlug(title);
  const id8 = id.replace(/-/g, '').slice(0, 8).toLowerCase();
  return slug ? `/audiobook/${slug}-${id8}` : `/audiobook/${id}`;
}

/** The readable path for any part of a book (an AudioBook item). The suffix is
 * that part's id; the resolver maps any part back to its book. */
export function bookPathForItem(item: JellyfinItem): string {
  return bookPath(bookTitle(item, 2), item.Id);
}

/** How a book ref from the URL is read — one explicit shape, never a guess
 * spread across nullable fields. */
export type BookRef =
  | { kind: 'id'; id: string }
  | { kind: 'slug-id8'; slug: string; id8: string }
  | { kind: 'slug'; slug: string };

const FULL_ID = /^[0-9a-f]{32}$/i;
const SLUG_ID8 = /^(.+)-([0-9a-f]{8})$/i;

/** Classify a ref: a full id, a slug with an 8-hex suffix, or a bare slug. */
export function parseBookRef(ref: string): BookRef {
  const r = ref.trim();
  if (FULL_ID.test(r)) return { kind: 'id', id: r.toLowerCase() };
  const m = SLUG_ID8.exec(r);
  if (m) return { kind: 'slug-id8', slug: m[1].toLowerCase(), id8: m[2].toLowerCase() };
  return { kind: 'slug', slug: bookSlug(r) };
}

const norm = (id: string) => id.replace(/-/g, '').toLowerCase();
const ids = (b: Book) => [b.id, ...b.parts.map((p) => p.Id)].map(norm);
/** The first book whose slug equals `slug`. The library arrives sorted by
 * SortName (getAudiobooks), so "first" is the SortName tie-break. */
function bySlug(slug: string, books: Book[]): Book | null {
  return books.find((b) => bookSlug(b.title) === slug) ?? null;
}

/**
 * Resolve a URL ref to a book in the user's library. A full id matches the book
 * or any of its parts (old links, and links shared from a later part). A
 * slug-id8 resolves by id prefix — unique wins; ambiguous or absent falls back
 * to the slug. A bare slug matches the title exactly. Null → "Book not found".
 */
export function resolveBookRef(ref: string, books: Book[]): Book | null {
  // Any exact id (book or part) wins outright, whatever its shape.
  const exact = norm(ref.trim());
  const direct = books.find((b) => ids(b).includes(exact));
  if (direct) return direct;
  const parsed = parseBookRef(ref);
  if (parsed.kind === 'id') return books.find((b) => ids(b).includes(parsed.id)) ?? null;
  if (parsed.kind === 'slug') return bySlug(parsed.slug, books);
  const hits = books.filter((b) => ids(b).some((id) => id.startsWith(parsed.id8)));
  if (hits.length === 1) return hits[0];
  return bySlug(parsed.slug, hits.length > 1 ? hits : books);
}
