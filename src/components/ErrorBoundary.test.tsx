import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // The thrown error logs to console.error; silence it for a clean run.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('shows a recoverable fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('content variant offers Try again instead of Reload', () => {
    render(
      <ErrorBoundary variant="content">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toHaveClass('error-boundary--content');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('auto-recovers when resetKey changes (e.g. navigation)', () => {
    const { rerender } = render(
      <ErrorBoundary variant="content" resetKey="/album/1">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    // Navigate away → new route → children render again, no crash screen.
    rerender(
      <ErrorBoundary variant="content" resetKey="/home">
        <p>new page</p>
      </ErrorBoundary>,
    );
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    expect(screen.getByText('new page')).toBeInTheDocument();
  });

  it('Try again re-renders the children in place', async () => {
    // A child that throws once, then renders on retry (simulates a transient
    // failure clearing after "Try again").
    let throwIt = true;
    function Flaky() {
      if (throwIt) throw new Error('once');
      return <p>recovered</p>;
    }
    render(
      <ErrorBoundary variant="content">
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    throwIt = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});
