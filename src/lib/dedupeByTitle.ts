import type { JellyfinItem } from './jellyfinTypes';

/** A live/alt marker in a track title, e.g. "(live)", "- Live", "[Remastered]".
 * Used to prefer the plain studio version when the same song appears twice. */
const LIVE_OR_ALT = /\b(live|acoustic|remaster(ed)?|demo|edit|version|mix|mono|remix)\b/i;

/** Normalise a title for cross-version matching: lowercase, drop any trailing
 * "(...)"/"[...]"/" - ..." qualifier so "Creep" and "Creep (Live)" collapse. */
function baseTitle(name: string): string {
  return name
    .replace(/\s*[([].*$/, '')
    .replace(/\s*-\s.*$/, '')
    .trim()
    .toLowerCase();
}

/** Collapse tracks that are the same song across albums/versions (e.g. a studio
 * cut + a live/remaster), keeping ONE per title. Preserves the input order
 * (relevance), but when a later duplicate is a cleaner studio version than the
 * one already kept, it replaces it — so the studio take wins regardless of which
 * came first. Used for the artist "Popular" row, where duplicates look sloppy. */
export function dedupeByTitle(tracks: JellyfinItem[]): JellyfinItem[] {
  const index = new Map<string, number>(); // baseTitle → position in out
  const out: JellyfinItem[] = [];
  for (const t of tracks) {
    const key = baseTitle(t.Name);
    const at = index.get(key);
    if (at === undefined) {
      index.set(key, out.length);
      out.push(t);
    } else if (LIVE_OR_ALT.test(out[at].Name) && !LIVE_OR_ALT.test(t.Name)) {
      // Kept one is live/alt, this one is plain studio → prefer the studio take
      // (in the kept slot, preserving relevance position).
      out[at] = t;
    }
  }
  return out;
}
