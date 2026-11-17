import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { writeForceOffline } from '../features/settings/forceOfflineStore';
import { LoadState } from './LoadState';

describe('LoadState', () => {
  it('renders children when ready', () => {
    render(
      <LoadState isLoading={false}>
        <p>ready content</p>
      </LoadState>,
    );
    expect(screen.getByText('ready content')).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    render(
      <LoadState isLoading>
        <p>ready content</p>
      </LoadState>,
    );
    expect(screen.getByTestId('load-loading')).toBeInTheDocument();
    expect(screen.queryByText('ready content')).not.toBeInTheDocument();
  });

  it('shows the skeleton instead of a spinner when provided', () => {
    render(
      <LoadState isLoading skeleton={<div data-testid="my-skeleton" />}>
        <p>ready content</p>
      </LoadState>,
    );
    expect(screen.getByTestId('my-skeleton')).toBeInTheDocument();
  });

  it('shows a retryable error, and error beats empty', async () => {
    const onRetry = vi.fn();
    render(
      <LoadState isLoading={false} isError isEmpty onRetry={onRetry}>
        <p>ready content</p>
      </LoadState>,
    );
    expect(screen.getByTestId('load-error')).toBeInTheDocument();
    expect(screen.queryByTestId('load-empty')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows a titled empty state distinct from loading', () => {
    render(
      <LoadState isLoading={false} isEmpty emptyTitle="No songs" emptyMessage="Add one">
        <p>ready content</p>
      </LoadState>,
    );
    expect(screen.getByText('No songs')).toBeInTheDocument();
    expect(screen.getByText('Add one')).toBeInTheDocument();
    expect(screen.queryByTestId('load-loading')).not.toBeInTheDocument();
  });

  describe('while offline', () => {
    afterEach(() => writeForceOffline(false));

    it('says the user is offline and offers the downloads, not "went wrong"', async () => {
      writeForceOffline(true);
      const retry = vi.fn();
      render(
        <MemoryRouter>
          <LoadState isLoading={false} isError onRetry={retry}>
            <p>ready content</p>
          </LoadState>
        </MemoryRouter>,
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('You’re offline');
      expect(alert).not.toHaveTextContent('Something went wrong');
      expect(screen.getByTestId('load-error-downloads')).toHaveAttribute('href', '/offline');
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(retry).toHaveBeenCalledOnce();
    });

    it('offers no retry button when there is nothing to retry', () => {
      writeForceOffline(true);
      render(
        <MemoryRouter>
          <LoadState isLoading={false} isError>
            <p />
          </LoadState>
        </MemoryRouter>,
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('a non-error screen is unaffected by being offline', () => {
      writeForceOffline(true);
      render(
        <MemoryRouter>
          <LoadState isLoading={false}>
            <p>cached content</p>
          </LoadState>
        </MemoryRouter>,
      );
      expect(screen.getByText('cached content')).toBeInTheDocument();
    });
  });
});
