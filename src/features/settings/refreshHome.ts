import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import { queryClient } from '../../lib/queryClient';

/** Force the CadenceConfig plugin to regenerate THIS user's Home shelves: POST
 * /Cadence/Home/Refresh drops the server-side cache entry and rebuilds it fresh
 * in the background (202, never blocks). Then drop the client's cached plugin
 * response so the next Home visit re-fetches the freshly-rebuilt shelves. For
 * when a user wants their recommendations recomputed now instead of waiting for
 * the daily prewarm / stale window. */
export async function refreshHomeShelves(): Promise<void> {
  const userId = getSession()?.userId ?? '';
  await request(`/Cadence/Home/Refresh?userId=${encodeURIComponent(userId)}`, { method: 'POST' });
  // Give the server a moment to rebuild, then invalidate the client's copy so
  // Home re-pulls the fresh data on next view.
  await new Promise((r) => setTimeout(r, 1500));
  await queryClient.invalidateQueries({ queryKey: ['home', 'plugin-shelves'] });
}
