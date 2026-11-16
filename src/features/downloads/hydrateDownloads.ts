import { hydrateDownloadIndex } from './downloadIndex';
import { hydrateOfflinePlaylists } from '../offline/offlinePlaylistStore';

/** Never hold the first paint hostage: a blocked IndexedDB open renders anyway
 * after this long (downloads then read as empty until a reload). */
export const HYDRATE_BUDGET_MS = 1500;

/**
 * Load the offline library's index from IndexedDB before the app's first render
 * — the player, the Downloads screen and the offline routes all ask "is this
 * downloaded?" synchronously, and must not see an empty index on an offline
 * launch. Asks the browser to keep the storage durable (best-effort) so a full
 * device doesn't silently evict a large offline library.
 */
export async function hydrateDownloads(budgetMs = HYDRATE_BUDGET_MS): Promise<void> {
  void navigator.storage?.persist?.().catch(() => false);
  const ready = Promise.all([hydrateDownloadIndex(), hydrateOfflinePlaylists()]).then(
    () => undefined,
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, budgetMs));
  await Promise.race([ready, timeout]);
}
