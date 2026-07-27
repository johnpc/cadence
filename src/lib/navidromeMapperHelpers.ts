/** Small field-shape helpers shared by navidromeMapper.ts's mediaItemFrom*
 * functions — split out to keep that file under the line-count gate. */

/** .NET ticks (10,000 per ms) from a Subsonic duration in whole seconds — the
 * unit every other MediaItem consumer (playerFormat, etc.) already expects. */
export function ticksFromSeconds(seconds: number | undefined): number | undefined {
  return seconds === undefined ? undefined : seconds * 10_000_000;
}

/** Prefers OpenSubsonic's linkable `artists[]` over the single `artist`
 * string, since it's the richer source when present. */
export function artistNames(
  artists: { name: string }[] | undefined,
  artist: string | undefined,
): string[] | undefined {
  if (artists?.length) return artists.map((a) => a.name);
  return artist ? [artist] : undefined;
}

export function artistItems(
  artists: { id: string; name: string }[] | undefined,
): { Id: string; Name: string }[] | undefined {
  return artists?.map((a) => ({ Id: a.id, Name: a.name }));
}

/** Prefers OpenSubsonic's linkable `genres[]` over the single `genre` string. */
export function genreNames(
  genres: { name: string }[] | undefined,
  genre: string | undefined,
): string[] | undefined {
  if (genres?.length) return genres.map((g) => g.name);
  return genre ? [genre] : undefined;
}
