/**
 * The extension registry: which acquisition tools this deployment offers.
 *
 * Cadence's core is a music CLIENT — play, search, library, playlists, offline.
 * Getting music that isn't in the library yet (Lidarr requests, Deezer playlist
 * import, Music Grabber) is an EXTENSION: optional, off unless the deployment
 * turns it on, and reachable from core screens only through `extensions/slots`.
 * Each flag is the one predicate for "is this on here?":
 *
 * - requests      the Lidarr proxy (nginx config.js, or the CadenceConfig plugin)
 * - deezerImport  the CadenceConfig plugin's /Cadence/Deezer endpoints
 * - grab          a Music Grabber URL (build default or Settings)
 *
 * ESLint (eslint.config.js) forbids core code from importing extension
 * internals — only this file and `slots/` — so the boundary can't erode.
 */
import { deezerImportEnabled, lidarrProxyEnabled } from '../lib/runtimeConfig';
import { musicGrabberConfigured } from '../lib/musicGrabberStore';

export type ExtensionId = 'requests' | 'deezerImport' | 'grab';

const FLAGS: Record<ExtensionId, () => boolean> = {
  requests: lidarrProxyEnabled,
  deezerImport: deezerImportEnabled,
  grab: musicGrabberConfigured,
};

/** Is this extension offered by this deployment (right now)? */
export const isExtensionEnabled = (id: ExtensionId): boolean => FLAGS[id]();
