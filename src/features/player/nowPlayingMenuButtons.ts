import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface NowPlayingMenuActions {
  goToSong: () => void;
  startRadio: () => void;
  goToAlbum: () => void;
  goToArtist: () => void;
  copyLink: () => void;
  newPlaylist: () => void;
  addTo: (playlist: JellyfinItem) => void;
}

interface SheetButton {
  text: string;
  role?: 'cancel';
  handler?: () => void;
}

/** Build the now-playing "…" action-sheet buttons: go to song, start a radio
 * seeded on it, go to album/artist (when known), copy link, create a playlist
 * with it, and add to each existing playlist. Pure so the ordering/inclusion
 * logic is unit-testable without IonActionSheet. */
export function nowPlayingMenuButtons(
  track: JellyfinItem,
  playlists: JellyfinItem[],
  a: NowPlayingMenuActions,
): SheetButton[] {
  const artist = track.ArtistItems?.[0];
  return [
    { text: 'Go to song', handler: a.goToSong },
    { text: 'Go to song radio', handler: a.startRadio },
    ...(track.AlbumId ? [{ text: 'Go to album', handler: a.goToAlbum }] : []),
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
    { text: 'New playlist…', handler: a.newPlaylist },
    ...playlists.map((pl) => ({ text: `Add to ${pl.Name}`, handler: () => a.addTo(pl) })),
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
