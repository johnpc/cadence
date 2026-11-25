import { useAuth } from './features/auth/useAuth';
import { SignIn } from './features/auth/SignIn';
import { AppTabs } from './AppTabs';
import { AppLoading, SessionUnavailable } from './AppLoading';
import { RouteAnnouncer } from './features/shell/RouteAnnouncer';
import { useWidgetDeepLink } from './features/widget/useWidgetDeepLink';

/**
 * The root session gate. While the Jellyfin session resolves we show the branded
 * loader; a signed-out user gets the sign-in screen; a signed-in user gets the
 * tab shell. Keeping the gate here (not per-route) means no data screen ever
 * renders before we know who the user is.
 */
export function AppRoutes() {
  const { status, refresh } = useAuth();
  // Widget + universal links (https://cadence.jpc.io/…) route here, above the
  // auth gate: signed out, the URL still moves and sign-in returns to it.
  useWidgetDeepLink();

  return (
    <>
      {/* Speaks the page name on every route change (screen-reader a11y). Lives
          above the auth branch so it announces sign-in ↔ app transitions too;
          when signed out/loading the shell shows a fixed screen regardless of
          path, so announce that rather than the underlying route. */}
      <RouteAnnouncer
        override={
          status === 'loading'
            ? 'Loading'
            : status === 'unavailable'
              ? "Can't open your sign-in"
              : status === 'unauthenticated'
                ? 'Sign in'
                : undefined
        }
      />
      {status === 'loading' ? (
        <AppLoading />
      ) : status === 'unavailable' ? (
        <SessionUnavailable onRetry={() => void refresh()} />
      ) : status === 'unauthenticated' ? (
        <SignIn />
      ) : (
        <AppTabs />
      )}
    </>
  );
}
