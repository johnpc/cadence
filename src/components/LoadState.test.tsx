import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
});
