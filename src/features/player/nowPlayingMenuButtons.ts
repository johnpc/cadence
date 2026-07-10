import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface NowPlayingMenuActions {
  goToSong: () => void;
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

/** Build the now-playing "…" action-sheet buttons: go to song, start a radio
 * seeded on it, go to album/artist (when known), copy link, and a single "Add
 * to playlist…" that opens a dedicated picker (rather than listing every
 * playlist inline). Pure so the ordering/inclusion logic is unit-testable. */
export function nowPlayingMenuButtons(
  track: JellyfinItem,
  a: NowPlayingMenuActions,
): SheetButton[] {
  const artist = track.ArtistItems?.[0];
  return [
    { text: 'Go to song', handler: a.goToSong },
    { text: 'Add to playlist…', handler: a.addToPlaylist },
    { text: 'Go to song radio', handler: a.startRadio },
    ...(track.AlbumId ? [{ text: 'Go to album', handler: a.goToAlbum }] : []),
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
