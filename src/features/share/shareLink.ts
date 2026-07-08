import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The in-app route for an item, or null for a plain track (no page). */
export function itemPath(item: JellyfinItem): string | null {
  switch (item.Type) {
    case 'MusicAlbum':
      return `/album/${item.Id}`;
    case 'MusicArtist':
      return `/artist/${item.Id}`;
    case 'Playlist':
      return `/playlist/${item.Id}`;
    default:
      return item.AlbumId ? `/album/${item.AlbumId}` : null;
  }
}

/** Absolute shareable URL for an item (its detail page; a track shares its
 * album). Returns null when there's nowhere to link (a track with no album). */
export function shareUrl(item: JellyfinItem, origin: string): string | null {
  const path = itemPath(item);
  return path ? `${origin}${path}` : null;
}

/** Copy the item's share URL to the clipboard. Resolves true on success. */
export async function copyShareLink(item: JellyfinItem, origin: string): Promise<boolean> {
  const url = shareUrl(item, origin);
  if (!url || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
