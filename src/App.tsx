import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './features/theme/ThemeProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { PlayerProvider } from './features/player/PlayerProvider';
import { ToastProvider } from './features/toast/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRoutes } from './AppRoutes';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional Ionic CSS utilities. Only `padding` is used (ion-padding, 12 files);
 * the rest (float / text-alignment / text-transformation / flex-utils / display
 * a.k.a. ion-hide) are unused — verified by class grep — so we drop them to trim
 * render-blocking CSS. Re-add if you start using those ion-* utility classes. */
import '@ionic/react/css/padding.css';

/**
 * Ionic Dark Mode — class-based palette. The theme manager toggles the
 * `.ion-palette-dark` class on <html> (dark by default), so light mode simply
 * drops the class. See src/features/theme + variables.css.
 */
import '@ionic/react/css/palettes/dark.class.css';

/* Brand fonts (bundled) + design tokens */
import './theme/fonts';
import './theme/variables.css';

// Disable Ionic's route/gesture animations ONLY under e2e (the harness sets
// window.__CADENCE_E2E__ before boot). Ionic keeps the outgoing page mounted and
// intercepts nav clicks during a transition — a real window that intermittently
// dropped nav clicks and left a stale hidden page (double testids) for automation.
// Instant transitions remove that window entirely. Production keeps animations.
setupIonicReact({
  animated: !(typeof window !== 'undefined' && window.__CADENCE_E2E__ === true),
});

const App: React.FC = () => (
  <IonApp>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <PlayerProvider>
                <IonReactRouter>
                  <AppRoutes />
                </IonReactRouter>
              </PlayerProvider>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </IonApp>
);

export default App;
