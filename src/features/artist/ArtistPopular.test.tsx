import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtistPopular } from './ArtistPopular';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'Hit A', Type: 'Audio', Artists: ['Band'] },
  { Id: 'b', Name: 'Hit B', Type: 'Audio' },
];

describe('ArtistPopular', () => {
  it('renders nothing without tracks', () => {
    const { container } = renderWithProviders(<ArtistPopular tracks={[]} />);
    expect(container.querySelector('[data-testid="artist-top"]')).toBeNull();
  });

  it('lists the tracks and plays them all', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<ArtistPopular tracks={tracks} />, { player: stubPlayer({ playQueue }) });
    expect(screen.getByText('Hit A')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });
});
