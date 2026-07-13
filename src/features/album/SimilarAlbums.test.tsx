import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getInstantMix: vi.fn(),
  getItemsByIds: vi.fn(),
}));
import { getInstantMix, getItemsByIds } from '../../lib/jellyfinItems';
import { SimilarAlbums } from './SimilarAlbums';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const mix: JellyfinItem[] = [
  { Id: 't1', Name: 'x', Type: 'Audio', AlbumId: 'al2' },
  { Id: 't2', Name: 'y', Type: 'Audio', AlbumId: 'al2' },
];
const hydrated: JellyfinItem[] = [
  { Id: 'al2', Name: 'Neighbour Album', Type: 'MusicAlbum', AlbumArtist: 'Other Band' },
];

function renderSimilar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/album/al1']}>
        <SimilarAlbums albumId="al1" />
        <Route
          path="*"
          render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SimilarAlbums', () => {
  afterEach(() => {
    vi.resetAllMocks();
    // Similar-albums now persist to a disk cache; clear it so one test's result
    // can't seed the next via initialData (both use albumId="al1").
    localStorage.clear();
  });

  it('shows albums from the radio mix and links to each', async () => {
    vi.mocked(getInstantMix).mockResolvedValue(mix);
    vi.mocked(getItemsByIds).mockResolvedValue(hydrated);
    renderSimilar();
    await waitFor(() => expect(screen.getByText('Neighbour Album')).toBeInTheDocument());
    expect(screen.getByText('Other Band')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Neighbour Album'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/al2');
  });

  it('renders nothing when the mix yields no sibling albums', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([]);
    vi.mocked(getItemsByIds).mockResolvedValue([]);
    const { container } = renderSimilar();
    await waitFor(() => expect(getItemsByIds).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="similar-albums"]')).toBeNull();
  });
});
