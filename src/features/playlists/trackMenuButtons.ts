import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface TrackMenuActions {
  playNext: () => void;
  addToQueue: () => void;
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

/** Build the "…" track-menu action-sheet buttons: play next, add to queue,
 * go to album/artist (when known), copy link, create a new playlist with this
 * track, and add to each existing playlist. Pure so the ordering/inclusion
 * logic is unit-testable without IonActionSheet. */
export function trackMenuButtons(
  track: JellyfinItem,
  playlists: JellyfinItem[],
  a: TrackMenuActions,
): SheetButton[] {
  const artist = track.ArtistItems?.[0];
  return [
    { text: 'Play next', handler: a.playNext },
    { text: 'Add to queue', handler: a.addToQueue },
    ...(track.AlbumId ? [{ text: 'Go to album', handler: a.goToAlbum }] : []),
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
    { text: 'New playlist…', handler: a.newPlaylist },
    ...playlists.map((pl) => ({ text: `Add to ${pl.Name}`, handler: () => a.addTo(pl) })),
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
