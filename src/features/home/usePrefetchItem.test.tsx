import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn(), getItemTracks: vi.fn() }));
vi.mock('../../lib/jellyfinArtists', () => ({ getArtistAlbums: vi.fn() }));
vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylistItems: vi.fn() }));
import { usePrefetchItem } from './usePrefetchItem';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const { result } = renderHook(() => usePrefetchItem(), { wrapper });
  return { prefetch: result.current, spy };
}

type PrefetchSpy = { mock: { calls: unknown[][] } };
const keysOf = (spy: PrefetchSpy) =>
  spy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePrefetchItem', () => {
  it('warms album metadata + tracks for an album', () => {
    const { prefetch, spy } = setup();
    prefetch({ Id: 'al', Name: 'A', Type: 'MusicAlbum' } as JellyfinItem);
    expect(keysOf(spy)).toEqual(['["album","al"]', '["album-tracks","al"]']);
  });

  it('warms artist metadata + albums for an artist', () => {
    const { prefetch, spy } = setup();
    prefetch({ Id: 'ar', Name: 'B', Type: 'MusicArtist' } as JellyfinItem);
    expect(keysOf(spy)).toEqual(['["artist","ar"]', '["artist-albums","ar"]']);
  });

  it('warms playlist metadata + items for a playlist', () => {
    const { prefetch, spy } = setup();
    prefetch({ Id: 'pl', Name: 'P', Type: 'Playlist' } as JellyfinItem);
    expect(keysOf(spy)).toEqual(['["playlist","pl"]', '["playlist-items","pl"]']);
  });

  it('is a no-op for songs and other types', () => {
    const { prefetch, spy } = setup();
    prefetch({ Id: 's', Name: 'S', Type: 'Audio' } as JellyfinItem);
    expect(spy).not.toHaveBeenCalled();
  });

  it('seeds the header query with the in-hand item so it paints instantly', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => usePrefetchItem(), { wrapper });
    const album = { Id: 'al', Name: 'Seeded Album', Type: 'MusicAlbum' } as JellyfinItem;
    result.current(album);
    // The header cache holds the tapped item immediately — no wait on getItem.
    expect(client.getQueryData(['album', 'al'])).toEqual(album);
  });
});
