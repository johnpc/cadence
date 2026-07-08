import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getAudioItems: vi.fn() }));
import { getAudioItems } from '../../lib/jellyfinItems';
import { PlayerContext } from '../player/PlayerContext';
import { Home } from './Home';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = { Id: 't1', Name: 'Home Track', Type: 'Audio', Artists: ['A'] };

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const player = { playQueue: vi.fn() } as unknown as PlayerContextValue;
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <Home />
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('Home', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders real tracks from the library', async () => {
    vi.mocked(getAudioItems).mockResolvedValue([track]);
    renderHome();
    expect(await screen.findByText('Home Track')).toBeInTheDocument();
  });

  it('shows an empty state when the library has no audio', async () => {
    vi.mocked(getAudioItems).mockResolvedValue([]);
    renderHome();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('shows a retryable error when the fetch fails', async () => {
    vi.mocked(getAudioItems).mockRejectedValue(new Error('boom'));
    renderHome();
    await waitFor(() => expect(screen.getByTestId('load-error')).toBeInTheDocument());
  });
});
