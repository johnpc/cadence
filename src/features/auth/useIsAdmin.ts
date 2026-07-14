import { useQuery } from '@tanstack/react-query';
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { JellyfinUser } from '../../lib/jellyfinTypes';

/** Whether the signed-in Jellyfin user is an administrator. Gates admin-only
 * features (e.g. requesting music, which writes to the shared library). Reads
 * `/Users/Me` once (react-query cached, long staleTime — a user's admin status
 * doesn't change mid-session). Defaults to false until known / when signed out. */
export function useIsAdmin(): boolean {
  const enabled = !!getSession()?.token;
  const q = useQuery({
    queryKey: ['me', 'is-admin'],
    queryFn: () => request<JellyfinUser>('/Users/Me'),
    enabled,
    staleTime: 30 * 60_000,
  });
  return q.data?.Policy?.IsAdministrator === true;
}
