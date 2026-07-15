/** Client for the Deezer import endpoint served by the CadenceConfig Jellyfin
 * plugin (POST /Cadence/Deezer/Import). It runs against Jellyfin itself, so the
 * Emby auth header rides along; no proxy or secret is involved (Deezer's public
 * API needs no key). The import is a heavy server operation — page the Deezer
 * playlist, then match every track against a 20k+ item library — so it uses its
 * OWN long timeout rather than jellyfinFetch's short interactive bound. */
import { apiUrl, embyAuthHeader } from '../../lib/jellyfinConfig';
import { getSession } from '../../lib/sessionStore';
import { parseDeezerPlaylistId } from './deezerUrl';
import type { DeezerImportResult } from './deezerTypes';

/** Import can page a large playlist and scan the whole library server-side —
 * allow generous headroom before giving up (well beyond interactive requests). */
const IMPORT_TIMEOUT_MS = 120_000;

/** Import a public Deezer playlist into a new Jellyfin playlist for the signed-in
 * user. Throws on an unreadable playlist (private/not-found/bad URL → 400) or any
 * non-2xx, so the hook can surface a clear message. */
export async function importDeezerPlaylist(raw: string): Promise<DeezerImportResult> {
  const id = parseDeezerPlaylistId(raw);
  if (!id) throw new Error('That doesn’t look like a Deezer playlist link.');
  const session = getSession();
  if (!session) throw new Error('Sign in to import a playlist.');

  const path = `/Cadence/Deezer/Import?userId=${encodeURIComponent(session.userId)}&url=${id}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl(path), {
      method: 'POST',
      headers: {
        'X-Emby-Authorization': embyAuthHeader(session.token),
        Authorization: `MediaBrowser Token="${session.token}"`,
      },
      signal: controller.signal,
    });
    if (res.status === 400) {
      throw new Error('Couldn’t read that playlist — make sure it’s public on Deezer.');
    }
    if (!res.ok) throw new Error(`Import failed (${res.status}).`);
    return (await res.json()) as DeezerImportResult;
  } finally {
    clearTimeout(timer);
  }
}
