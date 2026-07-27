/**
 * Low-level transport for the Lidarr proxy, returning the raw Response so callers
 * can inspect status + body (e.g. the duplicate-add ArtistExistsValidator 400).
 * Always the serving nginx's same-origin `/api/lidarr/*` (a curated allowlist),
 * which injects the write-capable API key SERVER-SIDE — never in the browser.
 */
const NGINX_BASE = '/api/lidarr';

/** GET the given Lidarr sub-path through the nginx proxy. */
export function lidarrFetch(path: string): Promise<Response> {
  return send('GET', path);
}

/** POST a JSON body to the given Lidarr sub-path through the nginx proxy. */
export function lidarrPost(path: string, body: unknown): Promise<Response> {
  return send('POST', path, body);
}

function send(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${NGINX_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
