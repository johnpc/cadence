/** Auth domain types shared across the auth feature. */

/**
 * The session, as one state:
 * - `loading`         resolving at launch (the branded splash).
 * - `authenticated`   a stored session was found (validated in the background).
 * - `unauthenticated` CONFIRMED no session → the sign-in screen.
 * - `unavailable`     the stored session couldn't be READ (e.g. iOS launched the
 *                     app before the phone was unlocked, so the Keychain is
 *                     locked). Not a sign-out: the app keeps retrying — on a
 *                     timer and whenever it comes back to the foreground — and
 *                     offers "Try again".
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable';

export interface AuthState {
  status: AuthStatus;
  /** Jellyfin username of the signed-in user, when authenticated. */
  username: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
