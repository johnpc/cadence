import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { WidgetSnapshot } from './widgetTypes';

const TICKS_PER_SECOND = 10_000_000;

/** The app deep link for an item, by kind. Mirrors the in-app detail routes so
 * the widget opens exactly where a tap in the app would go. */
export function itemPath(item: JellyfinItem): string {
  switch (item.Type) {
    case 'AudioBook':
      return `/audiobooks`;
    case 'MusicArtist':
      return `/artist/${item.Id}`;
    case 'Playlist':
      return `/playlist/${item.Id}`;
    default:
      return `/album/${item.Id}`;
  }
}

function kindOf(item: JellyfinItem): WidgetSnapshot['kind'] {
  switch (item.Type) {
    case 'AudioBook':
      return 'audiobook';
    case 'MusicArtist':
      return 'artist';
    case 'Playlist':
      return 'playlist';
    default:
      return 'album';
  }
}

/** A resumable audiobook's 0..1 progress from its saved position, or null. */
function bookProgress(item: JellyfinItem): number | null {
  const ticks = item.UserData?.PlaybackPositionTicks ?? 0;
  const total = item.RunTimeTicks ?? 0;
  if (ticks <= 0 || total <= 0) return null;
  return Math.min(1, ticks / total);
}

/**
 * Choose what the "Continue listening" widget shows and build its snapshot:
 * prefer an in-progress AUDIOBOOK (most-recent first — the list is already
 * ordered), else the most-recent collection the user played (album / playlist /
 * artist). Returns null when there's nothing to show (widget renders its empty
 * state). `artUrlFor` is injected so this stays pure + testable (no jellyfin
 * import); the sync hook passes the real imageUrl builder.
 */
export function buildSnapshot(
  resumableBooks: JellyfinItem[],
  recentCollections: JellyfinItem[],
  artUrlFor: (item: JellyfinItem) => string | null,
): WidgetSnapshot | null {
  const item = resumableBooks[0] ?? recentCollections[0];
  if (!item) return null;
  const kind = kindOf(item);
  const isBook = kind === 'audiobook';
  const subtitle = isBook
    ? (item.AlbumArtist ?? item.Artists?.[0] ?? 'Audiobook')
    : kind === 'artist'
      ? 'Artist'
      : kind === 'playlist'
        ? 'Playlist'
        : (item.AlbumArtist ?? item.Artists?.[0] ?? 'Album');
  const path = itemPath(item);
  return {
    id: item.Id,
    title: item.Name,
    subtitle,
    kind,
    artUrl: artUrlFor(item),
    progress: isBook ? bookProgress(item) : null,
    deepLink: `cadence://open?path=${encodeURIComponent(path)}`,
  };
}

/** Seconds remaining for an audiobook, for a "Xh Ym left" widget line (or null). */
export function secondsRemaining(item: JellyfinItem): number | null {
  const ticks = item.UserData?.PlaybackPositionTicks ?? 0;
  const total = item.RunTimeTicks ?? 0;
  if (ticks <= 0 || total <= 0) return null;
  return Math.max(0, (total - ticks) / TICKS_PER_SECOND);
}
