import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflineSegmentView } from './OfflineSegmentView';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { OfflineLibrary } from './offlineLibraryData';
import type { OfflineGroup } from './offlineGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' }) as JellyfinItem;
const group = (id: string): OfflineGroup => ({
  id,
  title: id,
  subtitle: '1 song',
  tracks: [song(id)],
  art: song(id),
  round: false,
});

const lib = (over: Partial<OfflineLibrary>): OfflineLibrary => ({
  songs: [],
  albums: [],
  artists: [],
  audiobooks: [],
  playlists: [],
  ...over,
});

describe('OfflineSegmentView', () => {
  it('renders a tile grid for album/artist/playlist segments', () => {
    renderWithProviders(
      <OfflineSegmentView segment="albums" lib={lib({ albums: [group('a')] })} />,
      {
        player: stubPlayer(),
      },
    );
    expect(screen.getByTestId('offline-grid')).toBeInTheDocument();
  });

  it('renders a flat track list for the songs segment', () => {
    renderWithProviders(
      <OfflineSegmentView segment="songs" lib={lib({ songs: [song('s1'), song('s2')] })} />,
      { player: stubPlayer() },
    );
    expect(screen.getByTestId('offline-songs')).toBeInTheDocument();
  });

  it('renders a book list for the audiobooks segment', () => {
    const book = { id: 'bk', book: song('bk'), title: 'Circe', parts: [song('bk')] };
    renderWithProviders(
      <OfflineSegmentView segment="audiobooks" lib={lib({ audiobooks: [book] })} />,
      { player: stubPlayer() },
    );
    expect(screen.getByTestId('offline-audiobooks')).toBeInTheDocument();
    expect(screen.getByText('Circe')).toBeInTheDocument();
  });
});
