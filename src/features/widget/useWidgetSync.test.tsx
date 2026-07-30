import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audiobook/useAudiobookLibrary', () => ({ useAudiobookHighlights: vi.fn() }));
vi.mock('../home/useJumpBackIn', () => ({ useJumpBackIn: vi.fn() }));
vi.mock('../../lib/jellyfinStream', () => ({ imageUrl: (i: { Id: string }) => `art:${i.Id}` }));
vi.mock('./widgetBridge', () => ({ hasWidgetBridge: vi.fn(), pushWidgetSnapshot: vi.fn() }));

import { useAudiobookHighlights } from '../audiobook/useAudiobookLibrary';
import { useJumpBackIn } from '../home/useJumpBackIn';
import { hasWidgetBridge, pushWidgetSnapshot } from './widgetBridge';
import { useWidgetSync } from './useWidgetSync';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = {
  Id: 'b1',
  Name: 'Dune',
  Type: 'AudioBook',
  RunTimeTicks: 100,
  UserData: { PlaybackPositionTicks: 25 },
} as JellyfinItem;

function setup(opts: { native: boolean; resumable?: JellyfinItem[]; recents?: JellyfinItem[] }) {
  vi.mocked(hasWidgetBridge).mockReturnValue(opts.native);
  vi.mocked(useAudiobookHighlights).mockReturnValue(opts.resumable ?? []);
  vi.mocked(useJumpBackIn).mockReturnValue({
    items: opts.recents ?? [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useWidgetSync', () => {
  it('does nothing off native (no bridge)', () => {
    setup({ native: false, resumable: [book] });
    renderHook(() => useWidgetSync());
    expect(pushWidgetSnapshot).not.toHaveBeenCalled();
  });

  it('disables the audiobook queries off native (no fetch on web)', () => {
    setup({ native: false });
    renderHook(() => useWidgetSync());
    // The perf fix: highlights are gated on `native`, so web never fires the
    // (formerly full-library) audiobook scan this hook used to trigger everywhere.
    expect(useAudiobookHighlights).toHaveBeenCalledWith(false);
  });

  it('enables the audiobook queries on native', () => {
    setup({ native: true, resumable: [book] });
    renderHook(() => useWidgetSync());
    expect(useAudiobookHighlights).toHaveBeenCalledWith(true);
  });

  it('pushes the snapshot on native', () => {
    setup({ native: true, resumable: [book] });
    renderHook(() => useWidgetSync());
    expect(pushWidgetSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b1', kind: 'audiobook' }),
    );
  });

  it('does not re-push when inputs are unchanged across re-renders', () => {
    setup({ native: true, resumable: [book] });
    const { rerender } = renderHook(() => useWidgetSync());
    rerender();
    expect(pushWidgetSnapshot).toHaveBeenCalledTimes(1);
  });
});
