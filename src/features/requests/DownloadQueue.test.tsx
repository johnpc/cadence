import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lidarrQueue', () => ({ getDownloadQueue: vi.fn() }));
import { getDownloadQueue } from './lidarrQueue';
import { DownloadQueue } from './DownloadQueue';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('DownloadQueue', () => {
  it('shows a progress row per active download', async () => {
    vi.mocked(getDownloadQueue).mockResolvedValue([{ id: 1, title: 'In Rainbows', percent: 60 }]);
    render(<DownloadQueue />, { wrapper });
    await waitFor(() => expect(screen.getByText('In Rainbows')).toBeInTheDocument());
    expect(screen.getByTestId('download-queue-row')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders nothing when the queue is empty (no empty box)', async () => {
    vi.mocked(getDownloadQueue).mockResolvedValue([]);
    const { container } = render(<DownloadQueue />, { wrapper });
    await waitFor(() => expect(getDownloadQueue).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="download-queue"]')).toBeNull();
  });
});
