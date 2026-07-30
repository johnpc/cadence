import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { NowPlayingSeek } from './NowPlayingSeek';

/**
 * NowPlayingSeek owns the fast-changing progress subscription (position/duration
 * from PlayerProgressContext) so the ~4Hz playback tick re-renders ONLY this bar,
 * not the whole mini-player. These tests lock that in: it reads progress from
 * context (not props) and commits a seek on release.
 */
describe('NowPlayingSeek', () => {
  it('reflects position/duration read from PlayerProgressContext', () => {
    renderWithProviders(<NowPlayingSeek seek={vi.fn()} />, {
      progress: { position: 30, duration: 120 },
    });
    const fill = screen.getByTestId('now-playing-progress').querySelector('.npbar__progress-fill');
    expect(fill).toHaveStyle({ width: '25%' }); // 30 / 120
  });

  it('commits a seek to the dragged position on release', () => {
    const seek = vi.fn();
    renderWithProviders(<NowPlayingSeek seek={seek} />, {
      progress: { position: 10, duration: 200 },
    });
    const range = screen.getByTestId('now-playing-seek');
    fireEvent.change(range, { target: { value: '75' } });
    fireEvent.pointerUp(range);
    expect(seek).toHaveBeenCalledWith(75);
  });
});
