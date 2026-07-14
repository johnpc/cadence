import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { ensureDeviceId } from '../../lib/deviceId';
import { hydrateServerUrl } from '../../lib/serverUrlStore';
import { hydrateMarlin } from '../../lib/marlinStore';
import { hydratePluginConfig } from '../../lib/pluginConfigStore';
import { onSessionExpired } from '../../lib/sessionExpiry';
import { queryClient } from '../../lib/queryClient';
import { clearPersistedQueue } from '../player/queuePersistence';
import type { AuthState } from './types';

/** Provides Jellyfin session state + auth actions to the tree via AuthContext. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', username: null });

  // resolveSession retries transient (cold-start network / token-storage /
  // offline) failures and only reports 'unauthenticated' on a CONFIRMED
  // no-session — so a flaky read never signs a user out. Load the durable
  // server URL + device id FIRST: the validating request must hit the server
  // the user signed into (not the build default) and carry a stable DeviceId.
  const refresh = useCallback(async () => {
    await hydrateServerUrl();
    await hydrateMarlin(); // optional search backend; no-op when unconfigured
    await ensureDeviceId();
    const resolved = await resolveSession();
    setState(resolved);
    // Once signed in, ask the server's CadenceConfig plugin (if installed) for
    // the client config — marlin/signup/cast URLs + the Lidarr proxy flag. This
    // is what makes those features work on native iOS (no nginx config.js there).
    if (resolved.status === 'authenticated') await hydratePluginConfig();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // When the server rejects our token mid-session (a 401 anywhere — a mutation,
  // a query, or an <audio> stream load), re-validate: resolveSession recovers if
  // it was transient, or flips to 'unauthenticated' (→ routing bounces to
  // sign-in) if the token is truly dead. Guarded by a ref so a burst of 401s
  // (many parallel requests) triggers a single revalidation, not a storm.
  const revalidating = useRef(false);
  useEffect(
    () =>
      onSessionExpired(() => {
        if (revalidating.current) return;
        revalidating.current = true;
        void refresh().finally(() => {
          revalidating.current = false;
        });
      }),
    [refresh],
  );

  const signIn = useCallback(
    async (username: string, password: string) => {
      await authClient.signIn(username, password);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    // Don't leak the previous user's data into the next session on a shared /
    // multi-user server: drop the cached Jellyfin responses (library, playlists,
    // likes) and the persisted play queue before flipping to signed-out.
    queryClient.clear();
    clearPersistedQueue();
    setState({ status: 'unauthenticated', username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
