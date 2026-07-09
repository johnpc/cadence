import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SongAbout } from './SongAbout';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al1',
  Name: 'The Album',
  Type: 'MusicAlbum',
  ProductionYear: 1985,
};
const artist: JellyfinItem = {
  Id: 'ar1',
  Name: 'The Artist',
  Type: 'MusicArtist',
  Overview: 'A short bio of the artist that gives context.',
};

function renderAbout(a: JellyfinItem | null, ar: JellyfinItem | null) {
  render(
    <MemoryRouter>
      <SongAbout album={a} artist={ar} />
    </MemoryRouter>,
  );
}

describe('SongAbout', () => {
  it('links the album card with its name and year', () => {
    renderAbout(album, null);
    const card = screen.getByTestId('song-about-album');
    expect(card).toHaveAttribute('href', '/album/al1');
    expect(card).toHaveTextContent('The Album');
    expect(card).toHaveTextContent('1985');
  });

  it('links the artist card with its name and bio snippet', () => {
    renderAbout(null, artist);
    const card = screen.getByTestId('song-about-artist');
    expect(card).toHaveAttribute('href', '/artist/ar1');
    expect(card).toHaveTextContent('The Artist');
    expect(card).toHaveTextContent(/short bio/);
  });

  it('renders both cards when both resolve', () => {
    renderAbout(album, artist);
    expect(screen.getByTestId('song-about')).toBeInTheDocument();
    expect(screen.getByTestId('song-about-album')).toBeInTheDocument();
    expect(screen.getByTestId('song-about-artist')).toBeInTheDocument();
  });

  it('renders nothing when neither resolves', () => {
    const { container } = render(
      <MemoryRouter>
        <SongAbout album={null} artist={null} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
