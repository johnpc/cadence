/**
 * Low-level transport for the Lidarr proxy, returning the raw Response so callers
 * can inspect status + body (e.g. the duplicate-add ArtistExistsValidator 400).
 * Two paths, both keeping the write-capable API key SERVER-SIDE:
 *  - nginx same-origin `/api/lidarr/*` (web/PWA), OR
 *  - the CadenceConfig Jellyfin plugin `/Cadence/Lidarr/*` (native iOS — no nginx),
 *    reached against the Jellyfin server with the Emby auth header attached.
 */
import { apiUrl, embyAuthHeader } from '../../lib/jellyfinConfig';
import { getSession } from '../../lib/sessionStore';
import { lidarrPluginProxyEnabled } from '../../lib/runtimeConfig';

const NGINX_BASE = '/api/lidarr';
const PLUGIN_BASE = '/Cadence/Lidarr';

/** GET the given Lidarr sub-path through whichever proxy is active. */
export function lidarrFetch(path: string): Promise<Response> {
  return send('GET', path);
}

/** POST a JSON body to the given Lidarr sub-path through whichever proxy is active. */
export function lidarrPost(path: string, body: unknown): Promise<Response> {
  return send('POST', path, body);
}

function send(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (lidarrPluginProxyEnabled()) {
    const token = getSession()?.token;
    headers['X-Emby-Authorization'] = embyAuthHeader(token);
    if (token) headers['Authorization'] = `MediaBrowser Token="${token}"`;
    return fetch(apiUrl(`${PLUGIN_BASE}${path}`), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  return fetch(`${NGINX_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
