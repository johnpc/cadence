import './appLoading.css';

/**
 * Branded app-init screen — shown during the `loading` window while the Jellyfin
 * session resolves, replacing the blank flash at the root gate. Theme-aware via
 * --cad-* tokens. Render-only; no logic, no fetching.
 */
export function AppLoading() {
  return (
    <div className="app-loading" role="status" aria-label="Loading Cadence">
      <span className="app-loading__wordmark cad-h1">Cadence</span>
      <span className="app-loading__spinner" aria-hidden="true" />
    </div>
  );
}
