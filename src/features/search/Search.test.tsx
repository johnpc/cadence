import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./searchSource', () => ({ searchSource: vi.fn() }));
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => vi.fn() }));
import { searchSource } from './searchSource';
import { PlayerContext } from '../player/PlayerContext';
import { Search } from './Search';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 's', Name: 'Found Song', Type: 'Audio', Artists: ['A'] };
const album: JellyfinItem = { Id: 'al', Name: 'Found Album', Type: 'MusicAlbum' };

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const player = { playQueue: vi.fn() } as unknown as PlayerContextValue;
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <Search />
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

async function type(text: string) {
  const { default: userEvent } = await import('@testing-library/user-event');
  const input = document.querySelector('input') as HTMLInputElement;
  await userEvent.type(input, text);
}

describe('Search', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the idle prompt before typing', () => {
    renderSearch();
    expect(screen.getByTestId('search-idle')).toBeInTheDocument();
  });

  it('renders grouped real results', async () => {
    vi.mocked(searchSource).mockResolvedValue([song, album]);
    renderSearch();
    await type('found');
    await waitFor(() => expect(screen.getByText('Found Song')).toBeInTheDocument());
    expect(screen.getByText('Found Album')).toBeInTheDocument();
    const results = screen.getByTestId('search-results');
    expect(within(results).getByText('Songs')).toBeInTheDocument();
    expect(within(results).getByText('Albums')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(searchSource).mockResolvedValue([]);
    renderSearch();
    await type('zzz');
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
