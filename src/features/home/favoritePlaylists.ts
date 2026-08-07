import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The favorited (hearted) subset of a playlist list — `UserData.IsFavorite`.
 * Pure so it's unit-testable and shared by the Home shelf + library ordering. */
export function favoritePlaylists(playlists: JellyfinItem[]): JellyfinItem[] {
  return playlists.filter((p) => p.UserData?.IsFavorite);
}
