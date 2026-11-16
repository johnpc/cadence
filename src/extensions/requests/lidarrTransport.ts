/**
 * Low-level transport for the Lidarr proxy, returning the raw Response so callers
 * can inspect status + body (e.g. the duplicate-add ArtistExistsValidator 400).
 * One path, on web and native alike: the CadenceConfig Jellyfin plugin's
 * `/Cadence/Lidarr/*`, reached against the Jellyfin server with the user's auth
 * header. The plugin requires a signed-in user, allowlists the Lidarr endpoints
 * and keeps the write-capable API key SERVER-SIDE. (The old same-origin nginx
 * `/api/lidarr` proxy had no sign-in check and is gone.)
 */
import { apiUrl, authHeaders } from '../../lib/jellyfinConfig';
import { getSession } from '../../lib/sessionStore';

const PLUGIN_BASE = '/Cadence/Lidarr';

/** GET the given Lidarr sub-path through the plugin proxy. */
export function lidarrFetch(path: string): Promise<Response> {
  return send('GET', path);
}

/** POST a JSON body to the given Lidarr sub-path through the plugin proxy. */
export function lidarrPost(path: string, body: unknown): Promise<Response> {
  return send('POST', path, body);
}

function send(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { ...authHeaders(getSession()?.token) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(apiUrl(`${PLUGIN_BASE}${path}`), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
