/**
 * Parse a URL the OS handed the app into an in-app router path. Two shapes:
 *  - `cadence://open?path=/audiobooks` — the widget's private scheme;
 *  - `https://cadence.jpc.io/<path>` — a universal link (a shared book, album…),
 *    which iOS routes to the app because ios/App/App/App.entitlements claims
 *    `applinks:cadence.jpc.io` and the site serves the association file.
 * Returns null when the URL isn't one of ours or the path is unsafe. Pure so
 * it's unit-testable without Capacitor.
 */

/** Hosts whose https links are in-app links (the domain the entitlement claims). */
export const UNIVERSAL_LINK_HOSTS = ['cadence.jpc.io'];

/** Only same-app absolute paths — never an external URL or a protocol-relative
 * "//host" that could navigate off-app. */
function safePath(path: string | null): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

export function parseOpenPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol === 'cadence:') {
    return parsed.host === 'open' ? safePath(parsed.searchParams.get('path')) : null;
  }
  if (
    parsed.protocol === 'https:' &&
    UNIVERSAL_LINK_HOSTS.includes(parsed.hostname.toLowerCase())
  ) {
    return safePath(`${parsed.pathname}${parsed.search}`);
  }
  return null;
}
