import type { MediaItem } from '../../lib/navidromeTypes';

/** A search backend: query → flat list of matching items (songs/albums/artists/
 * playlists). Both the native Navidrome source and the marlin source implement it. */
export type SearchSource = (query: string, limit?: number) => Promise<MediaItem[]>;
