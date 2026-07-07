import { useAuth } from './features/auth/useAuth';
import { SignIn } from './features/auth/SignIn';
import { AppTabs } from './AppTabs';
import { AppLoading } from './AppLoading';

/**
 * The root session gate. While the Jellyfin session resolves we show the branded
 * loader; a signed-out user gets the sign-in screen; a signed-in user gets the
 * tab shell. Keeping the gate here (not per-route) means no data screen ever
 * renders before we know who the user is.
 */
export function AppRoutes() {
  const { status } = useAuth();

  if (status === 'loading') return <AppLoading />;
  if (status === 'unauthenticated') return <SignIn />;
  return <AppTabs />;
}
