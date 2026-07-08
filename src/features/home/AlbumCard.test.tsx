import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AlbumCard } from './AlbumCard';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al',
  Name: 'Some Album',
  Type: 'MusicAlbum',
  AlbumArtist: 'The Band',
};

it('renders the album and plays it on tap', async () => {
  const onPlay = vi.fn();
  render(<AlbumCard item={album} onPlay={onPlay} />);
  expect(screen.getByText('Some Album')).toBeInTheDocument();
  expect(screen.getByText('The Band')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('album-card'));
  expect(onPlay).toHaveBeenCalledWith(album);
});
