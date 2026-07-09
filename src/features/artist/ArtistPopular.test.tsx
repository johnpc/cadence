import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArtistPopular } from './ArtistPopular';
import { renderWithProviders } from '../../test/renderWithProviders';
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

  it('lists the popular tracks', () => {
    renderWithProviders(<ArtistPopular tracks={tracks} />);
    expect(screen.getByText('Hit A')).toBeInTheDocument();
    expect(screen.getByText('Hit B')).toBeInTheDocument();
  });
});
