/**
 * The CadenceConfig plugin's Storyteller bridge (`/Cadence/Storyteller/*`), as
 * typed fetchers. The plugin holds every Storyteller account server-side (the
 * server maintainer configures it; accounts are created for users as needed)
 * and talks to Storyteller for us; the client only ever sees derived data — a
 * book's sentence timeline, chapter text, the shared position — never a
 * credential. There is no per-user setup in the app.
 * Wire shapes are the plugin's (PascalCase), hand-modelled here.
 */
import { request } from '../../lib/jellyfinFetch';
import { apiUrl, authHeaders } from '../../lib/jellyfinConfig';
import { getSession } from '../../lib/sessionStore';

/** Where the plugin stands on read-along for one audiobook. `ready` is the only
 * status with a populated `Clips`; the others say exactly why there is none. */
export type ReadAlongStatus = 'unlinked' | 'unmatched' | 'aligning' | 'mismatch' | 'ready';

/** One narrated sentence: its span on the GLOBAL book timeline (seconds from the
 * start of part 1), the chapter it lives in, and the element id to highlight. */
export interface ReadAlongClip {
  Start: number;
  End: number;
  Chapter: number;
  Fragment: string;
}

/** A Jellyfin part of the book in play order; offsets are cumulative durations. */
export interface ReadAlongPart {
  ItemId: string;
  Duration: number;
}

export interface ReadAlongChapter {
  Href: string;
  Title: string | null;
}

/** The plugin's whole read-along picture of a book, in one call. */
export interface ReadAlongBook {
  Status: ReadAlongStatus;
  BookUuid: string | null;
  Title: string | null;
  Duration: number;
  Parts: ReadAlongPart[];
  Chapters: ReadAlongChapter[];
  Clips: ReadAlongClip[];
}

/** The newer of Storyteller's and Jellyfin's saved position for a book. */
export interface SharedPosition {
  Seconds: number;
  Timestamp: number;
  Source: 'storyteller' | 'jellyfin';
}

const BASE = '/Cadence/Storyteller';

export function getReadAlongBook(itemId: string): Promise<ReadAlongBook> {
  return request<ReadAlongBook>(`${BASE}/Books/${encodeURIComponent(itemId)}`);
}

/** The proxied URL of one chapter resource (XHTML, image, css). For a `fetch`
 * the Authorization header does the auth; for an `<img src>` (which can't send
 * headers) pass `withApiKey` so Jellyfin's `ApiKey` query auth applies. */
export function chapterResourceUrl(itemId: string, path: string, withApiKey = false): string {
  const encoded = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `/Cadence/Storyteller/Books/${encodeURIComponent(itemId)}/Text/${encoded}`;
  if (!withApiKey) return apiUrl(url);
  const params = new URLSearchParams({ ApiKey: getSession()?.token ?? '' });
  return apiUrl(`${url}?${params.toString()}`);
}

/** A chapter's XHTML, raw. Goes through the same request layer for auth, the
 * timeout, reachability and 401 handling — but reads text, not JSON. */
export async function getChapterText(itemId: string, href: string): Promise<string> {
  return requestText(chapterResourceUrl(itemId, href));
}

async function requestText(url: string): Promise<string> {
  // request() parses JSON; chapter text is XHTML, so use the same auth headers on
  // a plain fetch. A non-2xx throws so react-query reports isError.
  const res = await fetch(url, { headers: authHeaders(getSession()?.token) });
  if (!res.ok) throw new Error(`Chapter text request failed: ${res.status}`);
  return res.text();
}

/** The shared position, or null when neither side has one (204). */
export async function getSharedPosition(itemId: string): Promise<SharedPosition | null> {
  const r = await request<SharedPosition | undefined>(
    `${BASE}/Books/${encodeURIComponent(itemId)}/Position`,
  );
  return r ?? null;
}
