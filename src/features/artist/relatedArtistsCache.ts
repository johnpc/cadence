import { getInstantMix } from '../../lib/jellyfinItems';
import { getArtistsByIds } from '../../lib/jellyfinArtists';
import { createItemListCache } from '../../lib/itemListCache';
import { rankRelatedArtistIds } from './rankRelated';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Disk cache of "Fans also like" (related artists). InstantMix-backed — the
 * app's slowest call (13-40s) — but rarely-changing, so persisting it makes a
 * revisit instant instead of re-waiting on InstantMix. Keyed by artist id. */
const relatedArtistsCache = createItemListCache('cadence.related-artists');
export const RELATED_ARTISTS_CACHE_KEY = relatedArtistsCache.storageKey;

/** Artists that recur across this artist's instant-mix radio, ranked by
 * co-occurrence then hydrated to cards. The Jellyfin /Similar endpoint is
 * polluted with playlist entries on this server, so we derive from the mix.
 * Limit 20: InstantMix latency scales steeply with Limit (~9s@10 vs ~21-37s@60)
 * and 20 tracks yield plenty of distinct artists. */
async function fetchRelatedArtists(artistId: string): Promise<JellyfinItem[]> {
  const mix = await getInstantMix(artistId, 20);
  return getArtistsByIds(rankRelatedArtistIds(mix, artistId));
}

/** Cached related artists for an id (undefined when not cached yet). */
export function getCachedRelatedArtists(artistId: string): JellyfinItem[] | undefined {
  return relatedArtistsCache.get(artistId);
}

/** Fetch related artists and persist them (query fn). */
export function fetchAndCacheRelatedArtists(artistId: string): Promise<JellyfinItem[]> {
  return relatedArtistsCache.fetchAndCache(artistId, fetchRelatedArtists);
}
