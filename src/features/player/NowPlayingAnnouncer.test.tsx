import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NowPlayingAnnouncer } from './NowPlayingAnnouncer';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 's1', Name: 'Test Song', Type: 'Audio', Artists: ['Tester'] };

describe('NowPlayingAnnouncer', () => {
  it('is a polite live region', () => {
    renderWithProviders(<NowPlayingAnnouncer />, { player: stubPlayer() });
    const region = screen.getByTestId('now-playing-announcer');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
  });

  it('speaks the current track', () => {
    renderWithProviders(<NowPlayingAnnouncer />, { player: stubPlayer({ current: song }) });
    expect(screen.getByTestId('now-playing-announcer')).toHaveTextContent(
      'Now playing: Test Song by Tester',
    );
  });

  it('says nothing when idle', () => {
    renderWithProviders(<NowPlayingAnnouncer />, { player: stubPlayer() });
    expect(screen.getByTestId('now-playing-announcer')).toHaveTextContent('');
  });
});
