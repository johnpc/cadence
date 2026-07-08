import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylistWithItems: vi.fn().mockResolvedValue('new1'),
}));
import { SaveQueueButton } from './SaveQueueButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const queue: JellyfinItem[] = [
  { Id: 'a', Name: 'One', Type: 'Audio' },
  { Id: 'b', Name: 'Two', Type: 'Audio' },
];

describe('SaveQueueButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing when the queue is empty', () => {
    const { container } = renderWithProviders(<SaveQueueButton queue={[]} />);
    expect(container.querySelector('[data-testid="queue-save"]')).toBeNull();
  });

  it('opens a name prompt when tapped', async () => {
    renderWithProviders(<SaveQueueButton queue={queue} />);
    const btn = screen.getByTestId('queue-save');
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(document.querySelector('ion-alert')).toBeTruthy();
  });
});
