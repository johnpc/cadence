/**
 * Sends pending offline likes (likeOutbox) whenever there is a chance the server
 * can be reached again: at start, when a session lands, when Jellyfin answers
 * again, when the browser reports it is back online, and when offline mode is
 * switched off. One flush at a time; a successful one refreshes the liked lists.
 */
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { getSession, onSessionChange } from '../../lib/sessionStore';
import { getReachability, onReachabilityChange } from '../../lib/reachabilityStore';
import { readForceOffline, onForceOfflineChange } from '../settings/forceOfflineStore';
import { flushLikes, likeOutboxStore } from './likeOutbox';
import { LIKED_SONGS_KEY } from './libraryApi';
import type { QueryClient } from '@tanstack/react-query';

const send = (itemId: string, liked: boolean) =>
  liked ? addFavorite(itemId) : removeFavorite(itemId);

export function startLikeOutboxSync(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
): () => void {
  let flushing = false;
  const tryFlush = async () => {
    if (flushing || !getSession() || readForceOffline()) return;
    if (getReachability() === 'offline') return;
    if (!Object.keys(likeOutboxStore.get()[getSession()?.userId ?? ''] ?? {}).length) return;
    flushing = true;
    try {
      if ((await flushLikes(send)) > 0) {
        void queryClient.invalidateQueries({ queryKey: LIKED_SONGS_KEY });
        void queryClient.invalidateQueries({ queryKey: ['audiobooks-favorites'] });
      }
    } finally {
      flushing = false;
    }
  };
  const kick = () => void tryFlush();
  const offs = [onSessionChange(kick), onReachabilityChange(kick), onForceOfflineChange(kick)];
  window.addEventListener('online', kick);
  kick();
  return () => {
    for (const off of offs) off();
    window.removeEventListener('online', kick);
  };
}
