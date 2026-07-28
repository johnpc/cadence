import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TrackDownloadBadge } from './TrackDownloadBadge';
import { setProgress, __resetProgress } from './downloadProgress';

afterEach(() => {
  __resetProgress();
  localStorage.clear();
});

describe('TrackDownloadBadge', () => {
  it('renders nothing for an untouched track', () => {
    const { container } = render(<TrackDownloadBadge id="a" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the live % once a download starts', () => {
    render(<TrackDownloadBadge id="a" />);
    act(() => setProgress('a', 0.6));
    expect(screen.getByTestId('download-badge')).toHaveAttribute('data-status', 'downloading');
    expect(screen.getByTestId('download-badge')).toHaveTextContent('60');
  });
});
