import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn(),
  createPlaylist: vi.fn(),
  getPlaylistItems: vi.fn(),
  addToPlaylist: vi.fn(),
}));

// Render IonAlert's inputs + buttons inline so the Create handler runs in jsdom.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonAlert: ({
      isOpen,
      buttons,
    }: {
      isOpen: boolean;
      buttons: { text: string; handler?: (d: { name?: string }) => void }[];
    }) =>
      isOpen ? (
        <div>
          {buttons.map((b) => (
            <button key={b.text} onClick={() => b.handler?.({ name: 'My Mix' })}>
              {b.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

import { CreatePlaylist } from './CreatePlaylist';
import { createPlaylist } from '../../lib/jellyfinPlaylists';
import { ToastContext } from '../toast/ToastContext';

function renderCreate(toast = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={toast}>
        <CreatePlaylist />
      </ToastContext.Provider>
    </QueryClientProvider>,
  );
  return toast;
}

describe('CreatePlaylist', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders a create button that opens the name prompt', async () => {
    renderCreate();
    await userEvent.click(screen.getByTestId('create-playlist'));
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('toasts success ONLY after the playlist is created', async () => {
    vi.mocked(createPlaylist).mockResolvedValue(undefined as never);
    const toast = renderCreate();
    await userEvent.click(screen.getByTestId('create-playlist'));
    await userEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Created "My Mix"'));
  });

  it('toasts an error (no false success) when creation fails', async () => {
    vi.mocked(createPlaylist).mockRejectedValue(new Error('401'));
    const toast = renderCreate();
    await userEvent.click(screen.getByTestId('create-playlist'));
    await userEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Couldn't create the playlist"));
    expect(toast).not.toHaveBeenCalledWith('Created "My Mix"');
  });
});
