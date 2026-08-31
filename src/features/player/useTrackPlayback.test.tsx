import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useTrackLoader', () => ({ useTrackLoader: vi.fn() }));
vi.mock('../audiobook/useAudiobookResume', () => ({ useAudiobookResume: vi.fn() }));
import { useTrackLoader } from './useTrackLoader';
import { useAudiobookResume } from '../audiobook/useAudiobookResume';
import { useTrackPlayback } from './useTrackPlayback';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b', Name: 'B', Type: 'AudioBook' } as JellyfinItem;

describe('useTrackPlayback', () => {
  it('wires the loader and the audiobook resume with the current track', () => {
    renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(null);
      useTrackPlayback(ref, book, 2);
    });
    expect(useTrackLoader).toHaveBeenCalledWith(expect.anything(), book, 2);
    // The reload nonce reaches the resume too, so a reload re-arms the one-shot
    // resume and the pending position seek applies to the fresh load.
    expect(useAudiobookResume).toHaveBeenCalledWith(expect.anything(), book, 2);
  });

  it('passes undefined (not null) to the loader when there is no track', () => {
    renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(null);
      useTrackPlayback(ref, null, 0);
    });
    expect(useTrackLoader).toHaveBeenCalledWith(expect.anything(), undefined, 0);
  });
});
