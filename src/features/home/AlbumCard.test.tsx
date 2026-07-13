import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlbumCard } from './AlbumCard';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al',
  Name: 'Some Album',
  Type: 'MusicAlbum',
  AlbumArtist: 'The Band',
};

describe('AlbumCard', () => {
  it('opens the item (navigates) when the card body is tapped — not play', async () => {
    const onOpen = vi.fn();
    const onPlay = vi.fn();
    render(<AlbumCard item={album} onOpen={onOpen} onPlay={onPlay} />);
    expect(screen.getByText('Some Album')).toBeInTheDocument();
    expect(screen.getByText('The Band')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('album-card-open'));
    expect(onOpen).toHaveBeenCalledWith(album);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('plays via the FAB without opening the detail page', async () => {
    const onOpen = vi.fn();
    const onPlay = vi.fn();
    render(<AlbumCard item={album} onOpen={onOpen} onPlay={onPlay} />);
    await userEvent.click(screen.getByTestId('album-card-play'));
    expect(onPlay).toHaveBeenCalledWith(album);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('prefetches the detail page on hover', async () => {
    const onPrefetch = vi.fn();
    render(<AlbumCard item={album} onOpen={vi.fn()} onPlay={vi.fn()} onPrefetch={onPrefetch} />);
    await userEvent.hover(screen.getByTestId('album-card'));
    expect(onPrefetch).toHaveBeenCalledWith(album);
  });

  it('prefetches on pointer-down too (mobile has no hover)', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const onPrefetch = vi.fn();
    render(<AlbumCard item={album} onOpen={vi.fn()} onPlay={vi.fn()} onPrefetch={onPrefetch} />);
    fireEvent.pointerDown(screen.getByTestId('album-card'));
    expect(onPrefetch).toHaveBeenCalledWith(album);
  });
});
