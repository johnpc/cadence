import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './features/theme/ThemeProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { PlayerProvider } from './features/player/PlayerProvider';
import { AppRoutes } from './AppRoutes';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode — class-based palette. The theme manager toggles the
 * `.ion-palette-dark` class on <html> (dark by default), so light mode simply
 * drops the class. See src/features/theme + variables.css.
 */
import '@ionic/react/css/palettes/dark.class.css';

/* Brand fonts (bundled) + design tokens */
import './theme/fonts';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PlayerProvider>
            <IonReactRouter>
              <AppRoutes />
            </IonReactRouter>
          </PlayerProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </IonApp>
);

export default App;
