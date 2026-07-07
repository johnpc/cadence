import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { ensureDeviceId } from '../../lib/deviceId';
import type { AuthState } from './types';

/** Provides Jellyfin session state + auth actions to the tree via AuthContext. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', username: null });

  // resolveSession retries transient (cold-start network / token-storage /
  // offline) failures and only reports 'unauthenticated' on a CONFIRMED
  // no-session — so a flaky read never signs a user out. The device id must be
  // loaded first so the validating request carries a stable DeviceId.
  const refresh = useCallback(async () => {
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
