/**
 * Jellyfin connection config: the base URL (a build-time constant — one server,
 * never varies per deploy) and the auth header builders. See ADR in CLAUDE.md.
 */
import { deviceId } from './deviceId';

/** Trailing-slash-free base URL of the Jellyfin server. */
export const JELLYFIN_URL: string = (import.meta.env.VITE_JELLYFIN_URL || '').replace(/\/$/, '');

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

/** Absolute URL for an API path (path must start with '/'). */
export function apiUrl(path: string): string {
  return `${JELLYFIN_URL}${path}`;
}
