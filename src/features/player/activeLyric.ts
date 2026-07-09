import type { LyricLine } from '../../lib/jellyfinLyrics';

/** True when at least one line carries timing — i.e. the track has synced
 * (LRC) lyrics we can karaoke-highlight. */
export function isSynced(lines: LyricLine[]): boolean {
  return lines.some((l) => l.start !== undefined);
}

/**
 * Index of the lyric line that should be highlighted at `positionSeconds`: the
 * last line whose start is ≤ position. Returns -1 before the first timed line
 * (or when the track isn't synced). Lines are assumed in ascending start order
 * (as Jellyfin returns them); untimed lines in a synced set are skipped as
 * highlight candidates but keep their place in the list.
 */
export function activeLineIndex(lines: LyricLine[], positionSeconds: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].start;
    if (start !== undefined && start <= positionSeconds) active = i;
  }
  return active;
}
