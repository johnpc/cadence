import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});

const run = vi.fn();
const grab = vi.fn();
let searchState: {
  results: unknown[];
  token: string;
  loading: boolean;
  error: boolean;
  searched: boolean;
};
vi.mock('./useGrabSearch', () => ({ useGrabSearch: () => ({ ...searchState, run }) }));
vi.mock('./useGrabDownload', () => ({ useGrabDownload: () => ({ busyId: null, grab }) }));

import { GrabSheet } from './GrabSheet';
import { renderWithProviders } from '../../test/renderWithProviders';

afterEach(() => {
  vi.clearAllMocks();
});

const aResult = {
  video_id: 'v1',
  title: 'Creep',
  channel: 'Radiohead',
  source: 'youtube',
  quality_score: 150,
  is_playlist: false,
  source_url: 'u',
  duration: 200,
  thumbnail: null,
  artist: null,
  album: null,
};

describe('GrabSheet', () => {
  it('runs the search when opened and lists results', async () => {
    searchState = {
      results: [aResult],
      token: 'tok',
      loading: false,
      error: false,
      searched: true,
    };
    renderWithProviders(<GrabSheet query="creep" open onClose={vi.fn()} />);
    await waitFor(() => expect(run).toHaveBeenCalledWith('creep'));
    expect(screen.getByTestId('grab-result')).toBeInTheDocument();
  });

  it('grabs a result with the search token', async () => {
    searchState = {
      results: [aResult],
      token: 'tok',
      loading: false,
      error: false,
      searched: true,
    };
    renderWithProviders(<GrabSheet query="creep" open onClose={vi.fn()} />);
    await userEvent.click(screen.getByTestId('grab-button'));
    expect(grab).toHaveBeenCalledWith(aResult, 'tok');
  });

  it('shows an empty state when nothing is found', () => {
    searchState = { results: [], token: '', loading: false, error: false, searched: true };
    renderWithProviders(<GrabSheet query="zzz" open onClose={vi.fn()} />);
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });
});
