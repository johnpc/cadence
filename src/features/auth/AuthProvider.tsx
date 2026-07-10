import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { ensureDeviceId } from '../../lib/deviceId';
import { hydrateServerUrl } from '../../lib/serverUrlStore';
import { onSessionExpired } from '../../lib/sessionExpiry';
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
    await ensureDeviceId();
    setState(await resolveSession());
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
    setState({ status: 'unauthenticated', username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
