import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AudiobookSeekButtons } from './AudiobookSeekButtons';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b1', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const song = { Id: 's1', Name: 'Song', Type: 'Audio' } as JellyfinItem;

function render(item: JellyfinItem, seek = vi.fn(), position = 100, duration = 300) {
  renderWithProviders(<AudiobookSeekButtons />, {
    player: stubPlayer({ current: item, seek }),
    progress: { position, duration },
  });
  return seek;
}

describe('AudiobookSeekButtons', () => {
  it('renders nothing for a music track', () => {
    render(song);
    expect(screen.queryByTestId('audiobook-seek')).not.toBeInTheDocument();
  });

  it('skips back 30s (clamped at 0)', async () => {
    const seek = render(book, vi.fn(), 10);
    await userEvent.click(screen.getByLabelText('Back 30 seconds'));
    expect(seek).toHaveBeenCalledWith(0); // 10 - 30 clamped to 0
  });

  it('skips forward 30s (clamped at duration)', async () => {
    const seek = render(book, vi.fn(), 100, 300);
    await userEvent.click(screen.getByLabelText('Forward 30 seconds'));
    expect(seek).toHaveBeenCalledWith(130);
  });

  it('does not overshoot the end', async () => {
    const seek = render(book, vi.fn(), 290, 300);
    await userEvent.click(screen.getByLabelText('Forward 30 seconds'));
    expect(seek).toHaveBeenCalledWith(300);
  });
});
