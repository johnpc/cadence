/**
 * The "Continue listening" snapshot the web app hands to the native iOS widget.
 * Kept to plain, small, serializable fields — the widget process can't run any
 * of our web code, so this JSON (written to a shared App Group) is the ENTIRE
 * contract. `deepLink` opens the app straight to the item.
 */
export interface WidgetSnapshot {
  /** Item id (also encoded in the deep link). */
  id: string;
  /** Primary line — the book/album/playlist title or artist name. */
  title: string;
  /** Secondary line — author/artist, or a kind label ("Playlist"). */
  subtitle: string;
  /** What kind of thing this is, so the widget can label/round art. */
  kind: 'audiobook' | 'album' | 'playlist' | 'artist';
  /** Cover art URL (absolute, token-bearing) or null → widget shows a placeholder. */
  artUrl: string | null;
  /** Listening progress 0..1 for a resumable audiobook; null when not applicable. */
  progress: number | null;
  /** cadence://open?... deep link that opens the app to this item. */
  deepLink: string;
}
