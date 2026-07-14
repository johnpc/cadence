/**
 * Fetches the Cadence client's runtime config from the server's CadenceConfig
 * Jellyfin plugin (GET /Cadence/Config) and merges it into
 * `window.__CADENCE_CONFIG__`, so features light up WITHOUT a per-device setup.
 *
 * This is what makes marlin search + Lidarr "request music" work on NATIVE iOS:
 * native has no nginx to write config.js, but every client signs into Jellyfin,
 * so the server hands out the config. Non-secret only — the Lidarr API key is
 * never sent; `lidarrProxy` is just a boolean and the client calls the plugin's
 * proxy (see lidarrApi). Runtime values already present (e.g. the web nginx
 * config.js) win, so this only fills gaps — the plugin never overrides a deploy.
 */
import { request } from './jellyfinFetch';

interface PluginConfigResponse {
  MarlinUrl?: string;
  SignupUrl?: string;
  CastReceiverAppId?: string;
  LidarrProxy?: boolean;
}

/** Merge a string value into the config only when it's non-empty AND not already
 * set by the deploy (runtime config.js wins over the plugin). */
function fillString(key: 'marlinUrl' | 'signupUrl' | 'castReceiverAppId', value?: string): void {
  const config = (window.__CADENCE_CONFIG__ ??= {});
  const trimmed = value?.trim();
  if (trimmed && !config[key]) config[key] = trimmed;
}

/**
 * Fetch /Cadence/Config and merge it into window.__CADENCE_CONFIG__. Requires a
 * signed-in session (the endpoint is authenticated) — call after the session is
 * resolved. Any failure (no plugin installed, offline, unauthenticated) is
 * swallowed: the app simply falls back to whatever config it already had.
 */
export async function hydratePluginConfig(): Promise<void> {
  try {
    const res = await request<PluginConfigResponse>('/Cadence/Config');
    fillString('marlinUrl', res.MarlinUrl);
    fillString('signupUrl', res.SignupUrl);
    fillString('castReceiverAppId', res.CastReceiverAppId);
    // The Lidarr proxy: nginx (web) sets lidarrProxy in config.js BEFORE boot; the
    // plugin sets it here only when nginx didn't. When the plugin is the source we
    // also flag lidarrPluginProxy so lidarrApi routes through Jellyfin's
    // /Cadence/Lidarr (works on native) instead of the same-origin /api/lidarr.
    const config = (window.__CADENCE_CONFIG__ ??= {});
    if (res.LidarrProxy === true && !config.lidarrProxy) {
      config.lidarrProxy = true;
      config.lidarrPluginProxy = true;
    }
  } catch {
    /* no plugin / offline / unauthenticated — keep existing config */
  }
}
