import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface AlbumMenuActions {
  startRadio: () => void;
  goToArtist: () => void;
  copyLink: () => void;
}

interface SheetButton {
  text: string;
  role?: 'cancel';
  handler?: () => void;
}

/** Build the album "…" overflow buttons: start an instant-mix radio seeded on
 * the album, jump to its artist (when known), and copy a share link — matching
 * the song/artist overflow menus. Pure so the inclusion logic is unit-testable. */
export function albumMenuButtons(album: JellyfinItem, a: AlbumMenuActions): SheetButton[] {
  const artist = album.ArtistItems?.[0];
  return [
    { text: 'Go to album radio', handler: a.startRadio },
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Copy link', handler: a.copyLink },
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
