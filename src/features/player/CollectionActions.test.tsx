import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollectionActions } from './CollectionActions';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'A', Type: 'Audio' },
  { Id: 'b', Name: 'B', Type: 'Audio' },
];

describe('CollectionActions', () => {
  it('plays the collection in order', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ playQueue }),
    });
    await userEvent.click(screen.getByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shuffle-plays the collection', async () => {
    const playShuffled = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ playShuffled }),
    });
    await userEvent.click(screen.getByTestId('shuffle-all'));
    expect(playShuffled).toHaveBeenCalledWith(tracks);
  });
});
