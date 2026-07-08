import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn(),
}));
import { getRecentlyPlayed } from '../../lib/jellyfinDiscover';
import { History } from './History';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const songs: JellyfinItem[] = [
  { Id: 't1', Name: 'Last Played', Type: 'Audio', Artists: ['A'] },
  { Id: 't2', Name: 'Earlier Song', Type: 'Audio' },
];

function renderHistory() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer()}>
        <MemoryRouter initialEntries={['/history']}>
          <History />
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('History', () => {
  it('lists the recently-played tracks and asks for a deep history', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue(songs);
    renderHistory();
    expect(await screen.findByText('Last Played')).toBeInTheDocument();
    expect(screen.getByText('Earlier Song')).toBeInTheDocument();
    expect(getRecentlyPlayed).toHaveBeenCalledWith(100);
  });

  it('shows an empty state when nothing has been played', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue([]);
    renderHistory();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
