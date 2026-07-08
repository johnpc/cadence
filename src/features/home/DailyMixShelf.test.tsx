import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const playItem = vi.fn();
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => playItem }));
import { DailyMixShelf } from './DailyMixShelf';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artists: JellyfinItem[] = [
  { Id: 'a1', Name: 'Radiohead', Type: 'MusicArtist' },
  { Id: 'a2', Name: 'Muse', Type: 'MusicArtist' },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe('DailyMixShelf', () => {
  it('renders a "<Artist> Mix" card per followed artist', () => {
    render(<DailyMixShelf artists={artists} />);
    expect(screen.getByText('Made for you')).toBeInTheDocument();
    expect(screen.getByText('Radiohead Mix')).toBeInTheDocument();
    expect(screen.getByText('Muse Mix')).toBeInTheDocument();
    expect(screen.getAllByTestId('daily-mix')).toHaveLength(2);
  });

  it('starts the artist radio when a mix is played', async () => {
    render(<DailyMixShelf artists={artists} />);
    await userEvent.click(screen.getAllByTestId('daily-mix-play')[0]);
    expect(playItem).toHaveBeenCalledWith(artists[0]);
  });

  it('renders nothing when the user follows no artists', () => {
    const { container } = render(<DailyMixShelf artists={[]} />);
    expect(container.querySelector('[data-testid="shelf"]')).toBeNull();
  });
});
