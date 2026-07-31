/**
 * Favorite (heart) mutations. Jellyfin's FavoriteItems endpoint is generic over
 * item type, so the same two calls favorite a track (liked songs), a playlist
 * (bubbles to the top of Your Library), an album, or an artist. Split from
 * jellyfinItems so that file stays under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';

/** Mark an item (track/playlist/album/artist) as a favorite for the user. */
export async function addFavorite(itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  await request(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'POST' });
}

/** Remove an item from the user's favorites. */
export async function removeFavorite(itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  await request(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'DELETE' });
}
