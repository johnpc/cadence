import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface TrackMenuActions {
  playNext: () => void;
  addToQueue: () => void;
  startRadio: () => void;
  goToAlbum: () => void;
  goToArtist: () => void;
  copyLink: () => void;
  /** Open the second sheet: New playlist + the full playlist list. */
  addToPlaylist: () => void;
  /** Toggle like/unlike. `liked` reflects the current state for the label. */
  toggleLike: () => void;
  liked: boolean;
  /** Toggle download. `downloaded` reflects the current state for the label. */
  toggleDownload: () => void;
  downloaded: boolean;
  /** Editable-playlist-only: reorder + remove. Present only when applicable. */
  moveUp?: () => void;
  moveDown?: () => void;
  removeFromPlaylist?: () => void;
}

interface SheetButton {
  text: string;
  role?: 'cancel' | 'destructive';
  handler?: () => void;
}

/** Build the "…" track-menu action-sheet buttons. Every per-track action lives
 * here (Spotify-mobile style) so the row itself stays art + title + "…": like,
 * download, play next, add to queue, add to playlist, radio, go to
 * album/artist, copy link, and — only in an editable playlist — move up/down +
 * remove. Pure so the ordering/inclusion logic is unit-testable. */
export function trackMenuButtons(track: JellyfinItem, a: TrackMenuActions): SheetButton[] {
  const artist = track.ArtistItems?.[0];
  return [
    { text: a.liked ? 'Remove from Liked Songs' : 'Add to Liked Songs', handler: a.toggleLike },
    { text: a.downloaded ? 'Remove download' : 'Download', handler: a.toggleDownload },
    { text: 'Play next', handler: a.playNext },
    { text: 'Add to queue', handler: a.addToQueue },
    { text: 'Add to playlist…', handler: a.addToPlaylist },
    ...(a.moveUp ? [{ text: 'Move up', handler: a.moveUp }] : []),
    ...(a.moveDown ? [{ text: 'Move down', handler: a.moveDown }] : []),
    { text: 'Go to song radio', handler: a.startRadio },
    ...(track.AlbumId ? [{ text: 'Go to album', handler: a.goToAlbum }] : []),
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
    ...(a.removeFromPlaylist
      ? [
          {
            text: 'Remove from this playlist',
            role: 'destructive' as const,
            handler: a.removeFromPlaylist,
          },
        ]
      : []),
    { text: 'Cancel', role: 'cancel' as const },
  ];
}

/** The SECOND sheet reached via "Add to playlist…": create a new playlist with
 * this track, or add it to any existing playlist. Separated so the primary
 * track menu stays short and the intent is obvious. */
export function addToPlaylistButtons(
  playlists: JellyfinItem[],
  a: { newPlaylist: () => void; addTo: (playlist: JellyfinItem) => void },
): SheetButton[] {
  return [
    { text: 'New playlist…', handler: a.newPlaylist },
    ...playlists.map((pl) => ({ text: pl.Name ?? 'Playlist', handler: () => a.addTo(pl) })),
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
