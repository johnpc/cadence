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
import { markConfigHydrated } from './pluginConfigHydration';

// The hydration signal lives in pluginConfigHydration.ts; re-exported so existing
// consumers can keep importing it from here.
export { isPluginConfigHydrated, usePluginConfigHydrated } from './pluginConfigHydration';

interface PluginConfigResponse {
  MarlinUrl?: string;
  SignupUrl?: string;
  CastReceiverAppId?: string;
  LidarrProxy?: boolean;
  DeezerImport?: boolean;
  Storyteller?: boolean;
}

/** Merge a string value into the config only when it's non-empty AND not already
 * set by the deploy (runtime config.js wins over the plugin). */
function fillString(key: 'marlinUrl' | 'signupUrl' | 'castReceiverAppId', value?: string): void {
  const config = (window.__CADENCE_CONFIG__ ??= {});
  const trimmed = value?.trim();
  if (trimmed && !config[key]) config[key] = trimmed;
}

/** Merge a boolean plugin-endpoint flag: set it only for an explicit `true` from
 * the plugin AND only when the deploy hasn't already set it (runtime config.js
 * wins). Keyed to the boolean flags so it can't target a string field. */
function fillFlag(
  config: NonNullable<typeof window.__CADENCE_CONFIG__>,
  key: 'deezerImport' | 'storyteller',
  value?: boolean,
): void {
  if (value === true && !config[key]) config[key] = true;
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
    // The Lidarr proxy lives ONLY in the plugin (signed-in users, allowlisted
    // endpoints) on web and native alike — so the plugin is its sole source.
    const config = (window.__CADENCE_CONFIG__ ??= {});
    config.lidarrProxy = res.LidarrProxy === true;
    // Plain plugin-endpoint flags: each tells the client an extension endpoint is
    // available (routes "Import from Deezer" to /Cadence/Deezer/Import). Only set
    // when the deploy didn't already (config.js wins). Older plugins also sent
    // HomeShelves/Audiobooks for retired fast paths; Home and Audiobooks are
    // always native now, so those are ignored.
    fillFlag(config, 'deezerImport', res.DeezerImport);
    fillFlag(config, 'storyteller', res.Storyteller);
  } catch {
    /* no plugin / offline / unauthenticated — keep existing config */
  } finally {
    // Either way, the plugin flags are now as final as they'll get — let
    // consumers (useHomeSource) stop waiting and read them.
    markConfigHydrated();
  }
}
