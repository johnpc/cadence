import { getSimilarSongs } from '../../lib/navidromeItems';
import { getArtistsByIds } from '../../lib/navidromeArtists';
import { createItemListCache } from '../../lib/itemListCache';
import { rankRelatedArtistIds } from './rankRelated';
import type { MediaItem } from '../../lib/navidromeTypes';

/** Disk cache of "Fans also like" (related artists). getSimilarSongs2-backed —
 * a historically slow call over a cold tunnel — but rarely-changing, so
 * persisting it makes a revisit instant instead of re-waiting on it. Keyed by
 * artist id. */
const relatedArtistsCache = createItemListCache('cadence.related-artists');
export const RELATED_ARTISTS_CACHE_KEY = relatedArtistsCache.storageKey;

/** Artists that recur across this artist's similar-songs radio, ranked by
 * co-occurrence then hydrated to cards (Subsonic has no dedicated related-
 * artists endpoint). Limit 20: latency scales steeply with the mix size on
 * getSimilarSongs2; kept conservative here, and 20 tracks yield plenty of
 * distinct artists. */
async function fetchRelatedArtists(artistId: string): Promise<MediaItem[]> {
  const mix = await getSimilarSongs(artistId, 20);
  return getArtistsByIds(rankRelatedArtistIds(mix, artistId));
}

/** Cached related artists for an id (undefined when not cached yet). */
export function getCachedRelatedArtists(artistId: string): MediaItem[] | undefined {
  return relatedArtistsCache.get(artistId);
}

/** Fetch related artists and persist them (query fn). */
export function fetchAndCacheRelatedArtists(artistId: string): Promise<MediaItem[]> {
  return relatedArtistsCache.fetchAndCache(artistId, fetchRelatedArtists);
}
