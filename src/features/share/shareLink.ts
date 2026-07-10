import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The in-app route for an item, or null when there's nowhere to link. */
export function itemPath(item: JellyfinItem): string | null {
  switch (item.Type) {
    case 'MusicAlbum':
      return `/album/${item.Id}`;
    case 'MusicArtist':
      return `/artist/${item.Id}`;
    case 'Playlist':
      return `/playlist/${item.Id}`;
    case 'Audio':
      // A track has its own song page; only fall back to the album if the id
      // is somehow missing (it never should be for a real track).
      return item.Id ? `/song/${item.Id}` : item.AlbumId ? `/album/${item.AlbumId}` : null;
    default:
      return item.AlbumId ? `/album/${item.AlbumId}` : null;
  }
}

/** Absolute shareable URL for an item (its detail page — a track links to its
 * own song page). Returns null when there's nowhere to link. */
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

/** How the share resolved, so the UI can toast the right confirmation. */
export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * Share an item the native way: the OS share sheet (Web Share API) when the
 * platform offers it — falling back to a clipboard copy on desktop. A user who
 * dismisses the share sheet (AbortError) gets 'failed' with no error toast at
 * the call site (treat it as a silent cancel there).
 */
export async function shareItem(item: JellyfinItem, origin: string): Promise<ShareResult> {
  const url = shareUrl(item, origin);
  if (!url) return 'failed';
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: item.Name, url });
      return 'shared';
    } catch (e) {
      // User dismissed the sheet — not an error; don't fall through to copy.
      if (e instanceof Error && e.name === 'AbortError') return 'failed';
      // Otherwise fall back to copying (e.g. share unsupported for this data).
    }
  }
  return (await copyShareLink(item, origin)) ? 'copied' : 'failed';
}
