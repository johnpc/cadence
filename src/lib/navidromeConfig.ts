/**
 * Navidrome/Subsonic connection config: the runtime base URL (chosen at
 * sign-in — see serverUrlStore; VITE_NAVIDROME_URL is only the initial
 * default) and the Subsonic auth query-param builder.
 */
import { getServerUrl } from './serverUrlStore';
import type { Session } from './navidromeTypes';

const CLIENT = 'Cadence';
const API_VERSION = '1.16.1';

/**
 * The `u`/`t`/`s`/`v`/`c`/`f` query params every Subsonic REST call needs.
 * `f=json` always — Navidrome never needs XML. Omits `u`/`t`/`s` when signed
 * out (the one call that runs before a session exists, /auth/login, isn't a
 * Subsonic-namespaced endpoint and doesn't use this builder at all).
 */
export function subsonicAuthParams(session: Session | null): URLSearchParams {
  const params = new URLSearchParams({ v: API_VERSION, c: CLIENT, f: 'json' });
  if (session) {
    params.set('u', session.username);
    params.set('t', session.subsonicToken);
    params.set('s', session.subsonicSalt);
  }
  return params;
}

/** Absolute URL for a Subsonic REST endpoint (path starts with '/', e.g.
 * '/getAlbumList2') against the active (runtime-configured) server. */
export function restUrl(path: string): string {
  return `${getServerUrl()}/rest${path}`;
}

/** Absolute URL for a native Navidrome endpoint outside the Subsonic REST
 * namespace (e.g. '/auth/login'), against the active server. */
export function apiUrl(path: string): string {
  return `${getServerUrl()}${path}`;
}
