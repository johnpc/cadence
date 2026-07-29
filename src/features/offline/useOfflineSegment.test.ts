import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { offlineSegments, useOfflineSegment } from './useOfflineSegment';
import type { OfflineLibrary } from './offlineLibraryData';
import type { OfflineGroup } from './offlineGroups';

const group = (id: string): OfflineGroup => ({
  id,
  title: id,
  subtitle: '',
  tracks: [],
  art: { Id: id } as never,
  round: false,
});

const lib = (over: Partial<OfflineLibrary>): OfflineLibrary => ({
  songs: [],
  albums: [],
  artists: [],
  audiobooks: [],
  playlists: [],
  ...over,
});

describe('offlineSegments', () => {
  it('returns all five segments in display order with counts', () => {
    const segs = offlineSegments(lib({ albums: [group('a')], songs: [{ Id: 's' } as never] }));
    expect(segs.map((s) => s.key)).toEqual([
      'playlists',
      'artists',
      'albums',
      'audiobooks',
      'songs',
    ]);
    expect(segs.find((s) => s.key === 'albums')?.count).toBe(1);
  });
});

describe('useOfflineSegment', () => {
  it('defaults to the first NON-EMPTY segment', () => {
    const { result } = renderHook(() => useOfflineSegment(lib({ albums: [group('a')] })));
    expect(result.current.segment).toBe('albums');
    expect(result.current.available.map((s) => s.key)).toEqual(['albums']);
  });

  it('honours an explicit selection', () => {
    const l = lib({ albums: [group('a')], artists: [group('r')] });
    const { result } = renderHook(() => useOfflineSegment(l));
    act(() => result.current.setSegment('artists'));
    expect(result.current.segment).toBe('artists');
  });

  it('falls back off an emptied selection to the first available', () => {
    const { result, rerender } = renderHook(({ l }) => useOfflineSegment(l), {
      initialProps: { l: lib({ playlists: [group('p')], albums: [group('a')] }) },
    });
    act(() => result.current.setSegment('albums'));
    rerender({ l: lib({ playlists: [group('p')] }) }); // albums now empty
    expect(result.current.segment).toBe('playlists');
  });
});
