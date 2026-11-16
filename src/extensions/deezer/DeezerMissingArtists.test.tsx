import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const hook = { missing: [] as string[], status: {} as Record<string, string>, request: vi.fn() };
vi.mock('./useDeezerMissing', () => ({ useDeezerMissing: () => hook }));

import { DeezerMissingArtists } from './DeezerMissingArtists';

afterEach(() => {
  hook.missing = [];
  vi.clearAllMocks();
});

describe('DeezerMissingArtists', () => {
  it('renders nothing when nothing is missing', () => {
    hook.missing = [];
    const { container } = render(<DeezerMissingArtists playlistId="pl1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the missing artists when present', () => {
    hook.missing = ['The Beatles', 'Louis Armstrong'];
    render(<DeezerMissingArtists playlistId="pl1" />);
    expect(screen.getByTestId('deezer-playlist-missing')).toBeInTheDocument();
    expect(screen.getAllByTestId('deezer-missing-row')).toHaveLength(2);
  });
});
