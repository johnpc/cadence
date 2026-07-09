import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { ensureDeviceId } from '../../lib/deviceId';
import { hydrateServerUrl } from '../../lib/serverUrlStore';
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
