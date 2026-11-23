import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface AlbumMenuActions {
  addToQueue: () => void;
  startRadio: () => void;
  goToArtist: () => void;
  share: () => void;
}

interface SheetButton {
  text: string;
  role?: 'cancel';
  handler?: () => void;
}

/** Build the album "…" overflow buttons: queue the album, start an instant-mix
 * radio seeded on it, jump to its artist (when known), and share it. The header
 * itself keeps only Save, Download, "…" and the Shuffle + Play pair, so these
 * secondary actions live here. Pure so the inclusion logic is unit-testable. */
export function albumMenuButtons(album: JellyfinItem, a: AlbumMenuActions): SheetButton[] {
  const artist = album.ArtistItems?.[0];
  return [
    { text: 'Add to queue', handler: a.addToQueue },
    { text: 'Go to album radio', handler: a.startRadio },
    ...(artist ? [{ text: 'Go to artist', handler: a.goToArtist }] : []),
    { text: 'Share', handler: a.share },
    { text: 'Cancel', role: 'cancel' as const },
  ];
}
