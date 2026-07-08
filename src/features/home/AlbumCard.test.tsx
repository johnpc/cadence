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

it('renders the album and fires onPlay when the card body is tapped', async () => {
  const onPlay = vi.fn();
  render(<AlbumCard item={album} onPlay={onPlay} />);
  expect(screen.getByText('Some Album')).toBeInTheDocument();
  expect(screen.getByText('The Band')).toBeInTheDocument();
  await userEvent.click(screen.getByText('Some Album'));
  expect(onPlay).toHaveBeenCalledWith(album);
});

it('shows a hover play FAB that plays immediately when onPlayNow is set', async () => {
  const onPlay = vi.fn();
  const onPlayNow = vi.fn();
  render(<AlbumCard item={album} onPlay={onPlay} onPlayNow={onPlayNow} />);
  await userEvent.click(screen.getByTestId('album-card-play'));
  expect(onPlayNow).toHaveBeenCalledWith(album);
  expect(onPlay).not.toHaveBeenCalled();
});

it('omits the play FAB without onPlayNow', () => {
  render(<AlbumCard item={album} onPlay={vi.fn()} />);
  expect(screen.queryByTestId('album-card-play')).not.toBeInTheDocument();
});
