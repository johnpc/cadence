/**
 * Readers for the runtime configuration (window.__CADENCE_CONFIG__) injected at
 * container startup by deploy/runtime-config.sh or merged from the CadenceConfig
 * Jellyfin plugin at sign-in. The config shape lives in runtimeConfigTypes.ts;
 * everything is optional, so every reader tolerates a missing config.js.
 */
import './runtimeConfigTypes';

/** A runtime-config boolean flag — true only for an explicit `true` (guards
 * against truthy strings an injected config might carry). */
function configFlag(
  key: 'marlinProxy' | 'lidarrProxy' | 'lidarrPluginProxy' | 'deezerImport',
): boolean {
  return window.__CADENCE_CONFIG__?.[key] === true;
}

/** A safe http(s) URL from a runtime-config field, or null when unset/invalid.
 * Rejects non-http(s) schemes (e.g. javascript:) so an injected value can't be
 * an XSS vector. */
function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** The runtime sign-up URL, or null when unset/invalid. */
export function signupUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.signupUrl);
}

/** The runtime default Jellyfin server URL, or null when unset/invalid. Used as
 * the sign-in default when the user hasn't already chosen a server. Trailing
 * slashes are left for serverUrlStore to normalise. */
export function configuredServerUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.serverUrl);
}

/** The configured custom Cast receiver app id, or null when unset/invalid.
 * Google Cast app ids are short alphanumeric tokens (e.g. "A1B2C3D4"); validate
 * the shape so an injected value can't smuggle anything unexpected into the
 * plugin's initialize call. */
export function castReceiverAppId(): string | null {
  const raw = window.__CADENCE_CONFIG__?.castReceiverAppId;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return /^[A-Za-z0-9]{4,16}$/.test(t) ? t : null;
}

/** The per-deploy default marlin-search base URL, or null when unset/invalid.
 * Only a default — the user's Settings choice (marlinStore) takes precedence. */
export function configuredMarlinUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.marlinUrl);
}

/** True when the deploy enabled the same-origin `/api/search` marlin proxy
 * (token injected server-side by nginx). Absent config.js (native) → false. */
export function marlinProxyEnabled(): boolean {
  return configFlag('marlinProxy');
}

/** True when the Lidarr proxy is available (nginx `/api/lidarr/*` OR the
 * CadenceConfig plugin). Gates the "request missing music" UI. */
export function lidarrProxyEnabled(): boolean {
  return configFlag('lidarrProxy');
}

/** True when the Lidarr proxy is the CadenceConfig Jellyfin plugin
 * (`/Cadence/Lidarr/*`) not nginx — the native-iOS path. See lidarrTransport. */
export function lidarrPluginProxyEnabled(): boolean {
  return configFlag('lidarrPluginProxy');
}

/** True when the CadenceConfig plugin exposes the Deezer import endpoint. Gates
 * the "Import from Deezer" screen (deezerApi calls POST /Cadence/Deezer/Import). */
export function deezerImportEnabled(): boolean {
  return configFlag('deezerImport');
}
