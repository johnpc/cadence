import { Component, type ErrorInfo, type ReactNode } from 'react';
import './errorBoundary.css';

interface Props {
  children: ReactNode;
  /** When this value changes, the boundary clears its error and re-renders its
   * children — e.g. pass the route path so navigating away from a crashed page
   * recovers automatically, no reload needed. */
  resetKey?: string;
  /** 'app' (default): full-screen crash screen with Reload. 'content': a lighter
   * in-place panel with Try again (resets the boundary) — for wrapping a content
   * area so a page crash doesn't take down the nav + player around it. */
  variant?: 'app' | 'content';
}
interface State {
  hasError: boolean;
}

/**
 * React error boundary — catches render crashes and shows a friendly,
 * recoverable UI instead of a blank white page. Two modes: the app root uses
 * 'app' (Reload); a content-level boundary uses 'content' (Try again + auto-
 * reset on navigation) so one bad page doesn't kill the whole shell. Class
 * component because error boundaries require lifecycle hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Cadence crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    // Navigated (or resetKey otherwise changed) → clear the error so the new
    // content renders instead of the stale crash screen.
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const content = this.props.variant === 'content';
    return (
      <div
        className={content ? 'error-boundary error-boundary--content' : 'error-boundary'}
        role="alert"
        data-testid="error-boundary"
      >
        <h1 className="error-boundary__title cad-headline">Something went wrong</h1>
        <p className="error-boundary__message cad-meta">
          {content
            ? 'This page hit an unexpected error. Try again, or head back.'
            : 'Cadence hit an unexpected error. Reloading usually fixes it.'}
        </p>
        <button
          type="button"
          className="error-boundary__reload"
          onClick={() => (content ? this.setState({ hasError: false }) : window.location.reload())}
        >
          {content ? 'Try again' : 'Reload'}
        </button>
      </div>
    );
  }
}
