import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../lib/jellyfinArtists', () => ({ getArtistAlbums: vi.fn() }));
import { getArtistAlbums } from '../../lib/jellyfinArtists';
import { MoreByArtist } from './MoreByArtist';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const albums: JellyfinItem[] = [
  { Id: 'al1', Name: 'This Album', Type: 'MusicAlbum' },
  { Id: 'al2', Name: 'Other Album', Type: 'MusicAlbum' },
];

function renderMore(excludeId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/album/al1']}>
        <MoreByArtist artistId="ar1" artistName="Band" excludeId={excludeId} />
        <Route
          path="*"
          render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MoreByArtist', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('lists the artist’s other albums, excluding the current one', async () => {
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderMore('al1');
    await waitFor(() => expect(screen.getByText('Other Album')).toBeInTheDocument());
    expect(screen.queryByText('This Album')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Other Album'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/al2');
  });

  it('renders nothing when there are no other albums', async () => {
    vi.mocked(getArtistAlbums).mockResolvedValue([albums[0]]);
    const { container } = renderMore('al1');
    await waitFor(() => expect(getArtistAlbums).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="more-by-artist"]')).toBeNull();
  });
});
