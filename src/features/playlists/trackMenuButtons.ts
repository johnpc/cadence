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
}

interface SheetButton {
  text: string;
  role?: 'cancel';
  handler?: () => void;
}

/** Build the "…" track-menu action-sheet buttons: play next, add to queue,
 * start a radio seeded on this track, go to album/artist (when known), copy
 * link, and a single "Add to playlist…" that opens a dedicated picker (rather
 * than dumping every playlist inline — far clearer what's going on). Pure so
 * the ordering/inclusion logic is unit-testable without IonActionSheet. */
export function trackMenuButtons(track: JellyfinItem, a: TrackMenuActions): SheetButton[] {
  const artist = track.ArtistItems?.[0];
  return [
    { text: 'Play next', handler: a.playNext },
    { text: 'Add to queue', handler: a.addToQueue },
    { text: 'Add to playlist…', handler: a.addToPlaylist },
    { text: 'Go to song radio', handler: a.startRadio },
    ...(track.AlbumId ? [{ text: 'Go to album', handler: a.goToAlbum }] : []),
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
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
