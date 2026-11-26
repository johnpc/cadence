import type { ReadAlongLibrary, ReadAlongStatus } from './storytellerApi';

/** The library list, indexed for per-row lookups. */
export interface ReadAlongIndex {
  state: ReadAlongLibrary['Status'];
  byItem: ReadonlyMap<string, ReadAlongStatus>;
  /** How many books can be read along right now. */
  ready: number;
}

/** Before the list loads, offline, or with no Storyteller bridge: nothing is
 * known, so nothing is badged and the Read along filter stays hidden. */
export const EMPTY_INDEX: ReadAlongIndex = { state: 'unconfigured', byItem: new Map(), ready: 0 };

export function indexLibrary(lib: ReadAlongLibrary): ReadAlongIndex {
  const byItem = new Map(lib.Books.map((b) => [b.ItemId, b.Status] as const));
  const ready = lib.Books.filter((b) => b.Status === 'ready').length;
  return { state: lib.Status, byItem, ready };
}

/** A grouped book's status. The plugin keys a book by its first part and so
 * does groupBooks, but the two can order parts differently (index vs name
 * tie-breaks), so any part's id also counts. */
export function statusOf(
  index: ReadAlongIndex,
  book: { id: string; parts: { Id: string }[] },
): ReadAlongStatus | undefined {
  return index.byItem.get(book.id) ?? book.parts.map((p) => index.byItem.get(p.Id)).find(Boolean);
}

export type BadgeKind = 'ready' | 'aligning';

/** What a book row/header says about read-along: "Read along" when it's ready,
 * "Aligning…" while Storyteller is still syncing it, and nothing otherwise —
 * an unmatched or broken book isn't something the listener can act on here. */
export function badgeFor(
  status: ReadAlongStatus | undefined,
): { kind: BadgeKind; label: string } | null {
  if (status === 'ready') return { kind: 'ready', label: 'Read along' };
  if (status === 'aligning') return { kind: 'aligning', label: 'Aligning…' };
  return null;
}
