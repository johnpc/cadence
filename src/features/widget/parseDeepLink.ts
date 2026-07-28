/**
 * Parse a Cadence deep link into an in-app router path. Accepts
 * `cadence://open?path=/audiobooks` (the widget's format) and returns the
 * decoded `path`, or null when the URL isn't a recognisable open link or the
 * path is unsafe. Pure so it's unit-testable without Capacitor.
 */
export function parseOpenPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // Accept cadence://open?... — scheme is "cadence:", host "open".
  if (parsed.protocol !== 'cadence:') return null;
  if (parsed.host !== 'open') return null;
  const path = parsed.searchParams.get('path');
  // Only allow same-app absolute paths (must start with a single "/") — never an
  // external URL or protocol-relative "//host" that could navigate off-app.
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}
