import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtistHeader } from './ArtistHeader';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artist: JellyfinItem = { Id: 'ar', Name: 'The Artist', Type: 'MusicArtist' };
const top: JellyfinItem[] = [
  { Id: 'a', Name: 'Hit A', Type: 'Audio' },
  { Id: 'b', Name: 'Hit B', Type: 'Audio' },
];

describe('ArtistHeader', () => {
  it('plays the artist top tracks from the header play button', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<ArtistHeader artist={artist} topTracks={top} onRadio={vi.fn()} />, {
      player: stubPlayer({ playQueue }),
    });
    await userEvent.click(screen.getByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(top, 0);
  });

  it('offers radio and omits the play button when there are no top tracks', () => {
    const onRadio = vi.fn();
    renderWithProviders(<ArtistHeader artist={artist} topTracks={[]} onRadio={onRadio} />);
    expect(screen.getByTestId('artist-radio')).toBeInTheDocument();
    expect(screen.queryByTestId('play-all')).not.toBeInTheDocument();
  });

  it('starts artist radio when Radio is tapped', async () => {
    const onRadio = vi.fn();
    renderWithProviders(<ArtistHeader artist={artist} topTracks={top} onRadio={onRadio} />);
    await userEvent.click(screen.getByTestId('artist-radio'));
    expect(onRadio).toHaveBeenCalledOnce();
  });
});
