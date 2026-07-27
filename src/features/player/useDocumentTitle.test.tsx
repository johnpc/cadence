import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';
import type { MediaItem } from '../../lib/navidromeTypes';

const track = (over: Partial<MediaItem> = {}): MediaItem => ({
  Id: 't',
  Name: 'Karma Police',
  Type: 'Audio',
  Artists: ['Radiohead'],
  ...over,
});

describe('useDocumentTitle', () => {
  it('sets "Song · Artist" while a track plays', () => {
    renderHook(() => useDocumentTitle(track()));
    expect(document.title).toBe('Karma Police · Radiohead');
  });

  it('uses just the name when there is no artist', () => {
    renderHook(() => useDocumentTitle(track({ Artists: [], AlbumArtist: undefined })));
    expect(document.title).toBe('Karma Police');
  });

  it('reverts to Cadence when nothing is playing', () => {
    const { rerender } = renderHook(({ c }) => useDocumentTitle(c), {
      initialProps: { c: track() as MediaItem | null },
    });
    expect(document.title).toBe('Karma Police · Radiohead');
    rerender({ c: null });
    expect(document.title).toBe('Cadence');
  });
});
