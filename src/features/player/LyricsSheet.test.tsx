import { screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the lyric lines', async () => {
    vi.mocked(useLyrics).mockReturnValue({
      lines: ['first line', 'second line'],
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
