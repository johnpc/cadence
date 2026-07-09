import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A disc within an album: its number and the tracks on it, each paired with
 * its index in the flat album queue (so playing a row still queues the whole
 * album, not just the disc). */
export interface AlbumDisc {
  disc: number;
  tracks: { track: JellyfinItem; index: number }[];
}

/** Group an album's (already disc-ordered) tracks by disc number. Returns a
 * single group when the album is one disc — the caller renders disc headers
 * only for genuine multi-disc albums (Spotify-style). Tracks missing a disc
 * number fall into disc 1. */
export function groupByDisc(tracks: JellyfinItem[]): AlbumDisc[] {
  const discs: AlbumDisc[] = [];
  tracks.forEach((track, index) => {
    const disc = track.ParentIndexNumber ?? 1;
    const last = discs[discs.length - 1];
    if (last && last.disc === disc) last.tracks.push({ track, index });
    else discs.push({ disc, tracks: [{ track, index }] });
  });
  return discs;
}

/** True when the album spans more than one disc — the only case that warrants
 * rendering "Disc N" headers. */
export function isMultiDisc(discs: AlbumDisc[]): boolean {
  return discs.length > 1;
}
