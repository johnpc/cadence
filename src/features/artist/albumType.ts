import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Spotify-style discography sections. */
export type AlbumSection = 'albums' | 'singles' | 'compilations';

/**
 * Classify an album into a discography section, Spotify-style. Jellyfin has no
 * native "album type", so we infer:
 * - Compilations: credited to "Various Artists" (a collection, not the artist's
 *   own release).
 * - Singles & EPs: short releases (≤6 tracks) — Spotify groups these together.
 * - Albums: everything else (a full-length, or a release with unknown length,
 *   which we default to the primary section rather than hiding).
 */
export function albumType(item: JellyfinItem): AlbumSection {
  if ((item.AlbumArtist ?? '').toLowerCase() === 'various artists') return 'compilations';
  const count = item.ChildCount;
  if (typeof count === 'number' && count > 0 && count <= 6) return 'singles';
  return 'albums';
}

export interface DiscographyGroup {
  section: AlbumSection;
  title: string;
  albums: JellyfinItem[];
}

const TITLES: Record<AlbumSection, string> = {
  albums: 'Albums',
  singles: 'Singles & EPs',
  compilations: 'Compilations',
};

/**
 * Split an artist's albums into ordered, non-empty discography groups (Albums →
 * Singles & EPs → Compilations), preserving the server's within-group order
 * (already newest-first). Empty sections are omitted so the page shows only what
 * the artist actually has.
 */
export function groupDiscography(albums: JellyfinItem[]): DiscographyGroup[] {
  const order: AlbumSection[] = ['albums', 'singles', 'compilations'];
  return order
    .map((section) => ({
      section,
      title: TITLES[section],
      albums: albums.filter((a) => albumType(a) === section),
    }))
    .filter((g) => g.albums.length > 0);
}
