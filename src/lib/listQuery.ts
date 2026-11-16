/**
 * Jellyfin computes a TOTAL match count for every list query unless told not to
 * — a second full query on the server. Cadence never reads `TotalRecordCount`,
 * and on a 30k-song library that count was most of a shelf's cost (0.48 s →
 * 0.18 s measured on Jellyfin 12.4). So every GET list read skips it.
 */
const LIST_PATH = /^\/(Items|Artists|Users\/[^/]+\/Items|Playlists\/[^/]+\/Items|Genres)(\/|\?|$)/;

/** `path` with `EnableTotalRecordCount=false` added to GET list reads that don't
 * already say otherwise. Anything else is returned unchanged. */
export function withoutTotalCount(path: string, method: string): string {
  if (method !== 'GET' || !LIST_PATH.test(path) || /EnableTotalRecordCount=/i.test(path))
    return path;
  return `${path}${path.includes('?') ? '&' : '?'}EnableTotalRecordCount=false`;
}
