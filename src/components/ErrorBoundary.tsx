import { Component, type ErrorInfo, type ReactNode } from 'react';
import './errorBoundary.css';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * App-wide error boundary — catches render crashes and shows a friendly,
 * recoverable screen (reload) instead of a blank white page. Class component
 * because React error boundaries require lifecycle hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Cadence crashed:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-boundary" role="alert" data-testid="error-boundary">
        <h1 className="error-boundary__title cad-headline">Something went wrong</h1>
        <p className="error-boundary__message cad-meta">
          Cadence hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          className="error-boundary__reload"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}
