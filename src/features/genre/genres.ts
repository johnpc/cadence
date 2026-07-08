/** A browsable music category, matched to a Jellyfin genre name. `color` gives
 * each tile its own Spotify-style hue. */
export interface Genre {
  name: string;
  color: string;
}

/** The curated "Browse all" categories. Jellyfin exposes ~890 raw genres, most
 * of them noisy (semicolon-joined, video categories) — so we hand-pick the
 * clean, well-populated ones rather than dumping the raw list. */
export const GENRES: Genre[] = [
  { name: 'Pop', color: '#e91429' },
  { name: 'Rock', color: '#e1118c' },
  { name: 'Hip-Hop', color: '#ba5d07' },
  { name: 'Country', color: '#d84000' },
  { name: 'R&B', color: '#8d67ab' },
  { name: 'Electronic', color: '#1e3264' },
  { name: 'Jazz', color: '#777777' },
  { name: 'Classical', color: '#7d4b32' },
  { name: 'Metal', color: '#503750' },
  { name: 'Folk', color: '#a56752' },
  { name: 'Blues', color: '#0d73ec' },
  { name: 'Punk', color: '#af2896' },
  { name: 'Soul', color: '#b02897' },
  { name: 'Reggae', color: '#148a08' },
  { name: 'Alternative', color: '#056952' },
  { name: 'Indie', color: '#537aa1' },
];

/** Look up a curated genre by name (case-insensitive), or undefined. */
export function findGenre(name: string): Genre | undefined {
  const lower = name.toLowerCase();
  return GENRES.find((g) => g.name.toLowerCase() === lower);
}
