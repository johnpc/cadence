import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});
vi.mock('./useLyrics', () => ({ useLyrics: vi.fn() }));
import { useLyrics } from './useLyrics';
import { LyricsSheet } from './LyricsSheet';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 's1', Name: 'Anthem', Type: 'Audio' };

describe('LyricsSheet', () => {
  beforeEach(() => {
    // jsdom has no layout — stub the karaoke auto-scroll.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the lyric lines', async () => {
    vi.mocked(useLyrics).mockReturnValue({
      lines: [{ text: 'first line' }, { text: 'second line' }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<LyricsSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: song }),
    });
    expect(await screen.findByText('first line')).toBeInTheDocument();
    expect(screen.getByText('second line')).toBeInTheDocument();
  });

  it('highlights the active line for synced lyrics at the current position', async () => {
    vi.mocked(useLyrics).mockReturnValue({
      lines: [
        { text: 'intro', start: 0 },
        { text: 'verse one', start: 2 },
        { text: 'verse two', start: 5 },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<LyricsSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: song }),
      progress: { position: 3, duration: 200 },
    });
    // At 3s the active line is "verse one" (start 2 ≤ 3 < 5).
    const active = await screen.findByText('verse one');
    expect(active).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('verse two')).not.toHaveAttribute('data-active');
  });

  it('shows an empty state when there are no lyrics', async () => {
    vi.mocked(useLyrics).mockReturnValue({
      lines: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<LyricsSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: song }),
    });
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
