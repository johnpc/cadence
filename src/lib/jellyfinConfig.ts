/**
 * Jellyfin connection config: the runtime base URL (chosen at sign-in — see
 * serverUrlStore; VITE_JELLYFIN_URL is only the initial default) and the auth
 * header builders.
 */
import { deviceId } from './deviceId';
import { getServerUrl } from './serverUrlStore';

const CLIENT = 'Cadence';
const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/**
 * The `X-Emby-Authorization` value. Jellyfin requires it on every request to
 * identify the client/device; the token (once signed in) rides here too.
 */
export function embyAuthHeader(token?: string): string {
  const device = deviceId();
  const parts = [
    `Client="${CLIENT}"`,
    `Device="${device}"`,
    `DeviceId="${device}"`,
    `Version="${VERSION}"`,
  ];
  if (token) parts.push(`Token="${token}"`);
  return `MediaBrowser ${parts.join(', ')}`;
}

/**
 * The auth headers for every JSON request. Jellyfin 12 REMOVED the legacy
 * `X-Emby-Authorization` header: a request carrying only it is a 400 (sign-in
 * "Error processing request."). The full MediaBrowser header (client + device +
 * token) must ride in the standard `Authorization` header — supported since
 * 10.8. The legacy header is still sent alongside for older servers.
 */
export function authHeaders(token?: string): Record<string, string> {
  const value = embyAuthHeader(token);
  return { Authorization: value, 'X-Emby-Authorization': value };
}

/** Absolute URL for an API path (path must start with '/'), against the active
 * (runtime-configured) server. */
export function apiUrl(path: string): string {
  return `${getServerUrl()}${path}`;
}
