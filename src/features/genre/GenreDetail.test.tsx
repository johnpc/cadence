import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinGenres', () => ({ getGenreTracks: vi.fn() }));
import { getGenreTracks } from '../../lib/jellyfinGenres';
import { GenreDetail } from './GenreDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 't1', Name: 'Pop Hit', Type: 'Audio', Artists: ['A'] },
  { Id: 't2', Name: 'Pop Deep Cut', Type: 'Audio' },
];

function renderGenre(entry = '/genre/Pop') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer()}>
        <MemoryRouter initialEntries={[entry]}>
          <Route path="/genre/:name">
            <GenreDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('GenreDetail', () => {
  it('shows the genre name and its tracks', async () => {
    vi.mocked(getGenreTracks).mockResolvedValue(tracks);
    renderGenre();
    expect(await screen.findByText('Pop Hit')).toBeInTheDocument();
    expect(screen.getByText('Pop Deep Cut')).toBeInTheDocument();
    expect(getGenreTracks).toHaveBeenCalledWith('Pop');
  });

  it('decodes a URL-encoded genre name', async () => {
    vi.mocked(getGenreTracks).mockResolvedValue([]);
    renderGenre('/genre/Hip-Hop');
    await waitFor(() => expect(getGenreTracks).toHaveBeenCalledWith('Hip-Hop'));
  });

  it('shows a track-count summary in the hero once tracks load', async () => {
    vi.mocked(getGenreTracks).mockResolvedValue(tracks);
    renderGenre();
    await waitFor(() => expect(screen.getByTestId('genre-summary')).toHaveTextContent('2 songs'));
  });

  it('shows an empty state when the genre has no tracks', async () => {
    vi.mocked(getGenreTracks).mockResolvedValue([]);
    renderGenre();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
