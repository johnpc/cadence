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

/**
 * The `unavailable` session screen: the saved sign-in couldn't be read yet
 * (typically iOS opened the app before the phone was unlocked). The app keeps
 * retrying on its own; "Try again" is for the impatient. Render-only.
 */
export function SessionUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="app-loading" role="alert" data-testid="session-unavailable">
      <span className="app-loading__wordmark cad-h1">Cadence</span>
      <p className="app-loading__message">Can&apos;t open your sign-in yet.</p>
      <p className="app-loading__hint cad-meta">
        If your phone just restarted, unlock it. Cadence keeps trying on its own.
      </p>
      <button
        type="button"
        className="app-loading__retry"
        onClick={onRetry}
        data-testid="session-retry"
      >
        Try again
      </button>
    </div>
  );
}
