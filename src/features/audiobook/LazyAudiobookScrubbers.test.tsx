import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useChapters', () => ({ useChapters: () => ({ chapters: [], isLoading: false }) }));
import { LazyAudiobookScrubbers } from './LazyAudiobookScrubbers';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('LazyAudiobookScrubbers', () => {
  it('reserves the space, then shows the bars once their chunk loads', async () => {
    const book: JellyfinItem = { Id: 'b', Name: 'Circe', Album: 'Circe', Type: 'AudioBook' };
    const { container } = renderWithProviders(<LazyAudiobookScrubbers />, {
      player: stubPlayer({ current: book }),
      progress: { position: 10, duration: 100 },
    });
    expect(container.querySelector('.fullplayer__scrubber-placeholder')).not.toBeNull();
    // The player's headline already names the book: the bar just says "Book".
    expect(await screen.findByTestId('book-progress-label')).toHaveTextContent(/^Book$/);
  });
});
