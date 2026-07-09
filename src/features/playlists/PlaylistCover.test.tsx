import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaylistCover } from './PlaylistCover';
import { setServerUrl } from '../../lib/serverUrlStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

setServerUrl('https://jf.test');

const track = (id: string): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  ImageTags: { Primary: 'tag' },
});

describe('PlaylistCover', () => {
  it('shows the playlist own art (no mosaic) when it has a cover', () => {
    const playlist: JellyfinItem = {
      Id: 'p',
      Name: 'Mix',
      Type: 'Playlist',
      ImageTags: { Primary: 'x' },
    };
    render(
      <PlaylistCover
        playlist={playlist}
        tracks={[track('a'), track('b'), track('c'), track('d')]}
      />,
    );
    expect(screen.queryByTestId('playlist-mosaic')).not.toBeInTheDocument();
  });

  it('renders a 4-tile mosaic when the playlist has no art but its tracks do', () => {
    const playlist: JellyfinItem = { Id: 'p', Name: 'Mix', Type: 'Playlist' };
    render(
      <PlaylistCover
        playlist={playlist}
        tracks={[track('a'), track('b'), track('c'), track('d')]}
      />,
    );
    const mosaic = screen.getByTestId('playlist-mosaic');
    expect(mosaic.querySelectorAll('img')).toHaveLength(4);
  });

  it('falls back to the standard cover when there is too little track art for a mosaic', () => {
    const playlist: JellyfinItem = { Id: 'p', Name: 'Mix', Type: 'Playlist' };
    render(<PlaylistCover playlist={playlist} tracks={[track('a'), track('b')]} />);
    expect(screen.queryByTestId('playlist-mosaic')).not.toBeInTheDocument();
  });
});
