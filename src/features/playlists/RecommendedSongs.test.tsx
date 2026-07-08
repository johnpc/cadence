import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn() }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  addToPlaylist: vi.fn().mockResolvedValue(undefined),
}));
import { getInstantMix } from '../../lib/jellyfinItems';
import { addToPlaylist } from '../../lib/jellyfinPlaylists';
import { RecommendedSongs } from './RecommendedSongs';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const rec = (id: string): JellyfinItem => ({ Id: id, Name: `Rec ${id}`, Type: 'Audio' });
const existing: JellyfinItem[] = [{ Id: 'have', Name: 'Have it', Type: 'Audio' }];

function renderRecs() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RecommendedSongs playlistId="p1" tracks={existing} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('RecommendedSongs', () => {
  it('recommends candidates not already in the playlist', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([rec('have'), rec('x'), rec('y')]);
    renderRecs();
    expect(await screen.findByText('Rec x')).toBeInTheDocument();
    expect(screen.getByText('Rec y')).toBeInTheDocument();
    expect(screen.queryByText('Have it')).not.toBeInTheDocument();
  });

  it('adds a recommendation and removes it from the list', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([rec('x'), rec('y')]);
    renderRecs();
    await screen.findByText('Rec x');
    await userEvent.click(screen.getByRole('button', { name: 'Add Rec x' }));
    await waitFor(() => expect(addToPlaylist).toHaveBeenCalledWith('p1', 'x'));
    expect(screen.queryByText('Rec x')).not.toBeInTheDocument();
    expect(screen.getByText('Rec y')).toBeInTheDocument();
  });

  it('dismisses a recommendation, hides it, and reveals a fresh candidate', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([
      rec('x'),
      rec('y'),
      rec('z'),
      rec('w'),
      rec('v'),
      rec('u'),
    ]);
    renderRecs();
    await screen.findByText('Rec x');
    // Only REC_VISIBLE (5) show; 'u' is held back.
    expect(screen.queryByText('Rec u')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss Rec x' }));
    expect(screen.queryByText('Rec x')).not.toBeInTheDocument();
    // The held-back candidate now fills the freed slot.
    expect(await screen.findByText('Rec u')).toBeInTheDocument();
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it('renders nothing when there are no fresh candidates', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([rec('have')]);
    const { container } = renderRecs();
    await waitFor(() => expect(getInstantMix).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="playlist-recs"]')).toBeNull();
  });

  it('does not fetch recommendations for an empty playlist', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <RecommendedSongs playlistId="p1" tracks={[]} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(getInstantMix).not.toHaveBeenCalled();
  });
});
