import { IonSpinner } from '@ionic/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useEffectiveOffline } from '../features/shell/useEffectiveOffline';
import './loadState.css';

export interface LoadStateProps {
  /** True while the initial fetch is in flight. */
  isLoading: boolean;
  /** True when the fetch failed. Takes priority over `isEmpty`. */
  isError?: boolean;
  /** Re-run the fetch (wired to the error state's Retry button). */
  onRetry?: () => void;
  /** True when the fetch succeeded but produced nothing to show. */
  isEmpty?: boolean;
  /** Title shown in the empty state. */
  emptyTitle?: string;
  /** Optional secondary line under the empty title. */
  emptyMessage?: string;
  /** Optional skeleton placeholder shown while loading instead of a spinner. */
  skeleton?: ReactNode;
  /** The ready content — rendered only when not loading/error/empty. */
  children: ReactNode;
}

/** A failed load while the server can't be reached: say WHY, and point at
 * what still works (the downloads) instead of a generic "went wrong". */
function OfflineError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="load-state" role="alert" data-testid="load-error" data-offline="true">
      <p className="load-state__title cad-headline-sm">You’re offline</p>
      <p className="load-state__message cad-meta">This needs a connection to your server.</p>
      <Link className="load-state__retry" to="/offline" data-testid="load-error-downloads">
        Browse your downloads
      </Link>
      {onRetry && (
        <button type="button" className="load-state__link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * The four outcomes of any data screen, handled once so no fetch silently
 * hangs on a spinner or shows a blank. Error beats empty; an empty result is
 * NOT treated as "still loading" (the classic infinite-spinner bug). An error
 * while offline says so and offers the downloads.
 */
export function LoadState(props: LoadStateProps) {
  const { isLoading, isError, onRetry, isEmpty, emptyTitle, emptyMessage, skeleton, children } =
    props;
  const offline = useEffectiveOffline();

  if (isError && offline) return <OfflineError onRetry={onRetry} />;
  if (isError) {
    return (
      <div className="load-state" role="alert" data-testid="load-error">
        <p className="load-state__title cad-headline-sm">Something went wrong.</p>
        {onRetry && (
          <button type="button" className="load-state__retry" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    if (skeleton) return <div data-testid="load-loading">{skeleton}</div>;
    return (
      <div className="load-state" data-testid="load-loading">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="load-state" data-testid="load-empty">
        <p className="load-state__title cad-headline-sm">{emptyTitle ?? 'Nothing here yet'}</p>
        {emptyMessage && <p className="load-state__message cad-meta">{emptyMessage}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
