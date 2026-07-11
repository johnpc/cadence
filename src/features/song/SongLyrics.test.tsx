import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinLyrics', () => ({ getLyrics: vi.fn() }));
import { getLyrics } from '../../lib/jellyfinLyrics';
import { SongLyrics } from './SongLyrics';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 's1', Name: 'A Song', Type: 'Audio' };

function renderLyrics(player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <SongLyrics song={song} />
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('SongLyrics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders nothing when the song has no lyrics', async () => {
    vi.mocked(getLyrics).mockResolvedValue([]);
    renderLyrics();
    // Once the empty result resolves, the whole section is omitted.
    await waitFor(() => expect(screen.queryByTestId('song-lyrics')).not.toBeInTheDocument());
  });

  it('shows the lyric lines when present, incl. blank spacer lines (timed + untimed)', async () => {
    vi.mocked(getLyrics).mockResolvedValue([
      { text: 'first line' },
      { text: '' }, // blank untimed line → renders a spacer, not empty
      { text: '', start: 10 }, // blank timed line → tappable spacer
      { text: 'last line', start: 20 },
    ]);
    renderLyrics();
    expect(await screen.findByText('first line')).toBeInTheDocument();
    expect(screen.getByText('last line')).toBeInTheDocument();
    expect(screen.getByTestId('song-lyrics')).toBeInTheDocument();
  });

  it('shows an error state with a working retry, then the lyrics', async () => {
    vi.mocked(getLyrics)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([{ text: 'recovered line' }]);
    renderLyrics();
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }));
    expect(await screen.findByText('recovered line')).toBeInTheDocument();
  });

  it('plays the song from a synced line’s timestamp when tapped', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(getLyrics).mockResolvedValue([{ text: 'chorus', start: 42 }]);
    const playQueue = vi.fn();
    const seek = vi.fn();
    renderLyrics(stubPlayer({ playQueue, seek }));
    const line = await screen.findByText('chorus');
    await userEvent.click(line);
    expect(playQueue).toHaveBeenCalledWith([song], 0);
    vi.advanceTimersByTime(350);
    expect(seek).toHaveBeenCalledWith(42);
  });
});
