import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

// IonSegment calls scrollTo (absent in jsdom) → render plain elements instead so
// the test focuses on which segment buttons appear, not Ionic's scroll behaviour.
vi.mock('@ionic/react', () => ({
  IonSegment: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  IonSegmentButton: ({ children, ...r }: { children: ReactNode; 'data-testid'?: string }) => (
    <button data-testid={r['data-testid']}>{children}</button>
  ),
  IonLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

// The segment CONTENT is covered by OfflineSegmentView's own test; stub it here
// so this test targets the page's empty state + segment bar in isolation.
vi.mock('./OfflineSegmentView', () => ({
  OfflineSegmentView: () => <div data-testid="seg-view" />,
}));
vi.mock('./useOfflineLibrary', () => ({ useOfflineLibrary: vi.fn() }));
import { useOfflineLibrary } from './useOfflineLibrary';
import { OfflineLibrary } from './OfflineLibrary';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { OfflineLibrary as Lib } from './offlineLibraryData';
import type { OfflineGroup } from './offlineGroups';

const group = (id: string): OfflineGroup => ({
  id,
  title: id,
  subtitle: '1 song',
  tracks: [],
  art: { Id: id } as never,
  round: false,
});

const empty: Lib = { songs: [], albums: [], artists: [], audiobooks: [], playlists: [] };

describe('OfflineLibrary', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the empty state when nothing is downloaded', () => {
    vi.mocked(useOfflineLibrary).mockReturnValue(empty);
    renderWithProviders(<OfflineLibrary />, { player: stubPlayer() });
    expect(screen.getByText('Nothing downloaded yet')).toBeInTheDocument();
  });

  it('renders a segment bar with only the non-empty categories', () => {
    vi.mocked(useOfflineLibrary).mockReturnValue({ ...empty, albums: [group('a')] });
    renderWithProviders(<OfflineLibrary />, { player: stubPlayer() });
    expect(screen.getByTestId('offline-library')).toBeInTheDocument();
    expect(screen.getByTestId('offline-seg-albums')).toBeInTheDocument();
    expect(screen.queryByTestId('offline-seg-songs')).not.toBeInTheDocument();
  });
});
