/** Reads a Deezer playlist's persisted missing-artist list from the CadenceConfig
 * plugin (GET /Cadence/Deezer/Subscription). The plugin recomputes it against the
 * current library on read, so an artist Lidarr has filled in since import is
 * already gone. Runs against Jellyfin itself with the Emby auth header; a 404
 * (the playlist isn't a Deezer subscription) yields null — not an error. */
import { apiUrl, embyAuthHeader } from '../../lib/jellyfinConfig';
import { getSession } from '../../lib/sessionStore';

/** The plugin's subscription status (PascalCase — .NET serialization). */
export interface DeezerSubscriptionStatus {
  DeezerPlaylistId: string;
  MissingArtists: string[];
}

/** The missing artists for a Jellyfin playlist that mirrors a Deezer playlist, or
 * null when the playlist isn't a Deezer subscription (404) or there's no session.
 * Any transport error also yields null — the section simply doesn't render. */
export async function getDeezerSubscription(
  playlistId: string,
): Promise<DeezerSubscriptionStatus | null> {
  const session = getSession();
  if (!session) return null;
  const path = `/Cadence/Deezer/Subscription?userId=${encodeURIComponent(session.userId)}&playlistId=${encodeURIComponent(playlistId)}`;
  try {
    const res = await fetch(apiUrl(path), {
      headers: {
        'X-Emby-Authorization': embyAuthHeader(session.token),
        Authorization: `MediaBrowser Token="${session.token}"`,
      },
    });
    if (!res.ok) return null; // 404 = not a Deezer playlist; anything else → hide
    return (await res.json()) as DeezerSubscriptionStatus;
  } catch {
    return null;
  }
}
