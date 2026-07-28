import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DownloadBadge } from './DownloadBadge';

describe('DownloadBadge', () => {
  it('renders nothing when status is none', () => {
    const { container } = render(<DownloadBadge status="none" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a downloaded badge', () => {
    render(<DownloadBadge status="downloaded" />);
    const badge = screen.getByTestId('download-badge');
    expect(badge).toHaveAttribute('data-status', 'downloaded');
    expect(badge).toHaveAttribute('aria-label', 'Downloaded');
  });

  it('shows a live percentage while downloading', () => {
    render(<DownloadBadge status="downloading" fraction={0.42} />);
    const badge = screen.getByTestId('download-badge');
    expect(badge).toHaveAttribute('data-status', 'downloading');
    expect(badge).toHaveAttribute('aria-valuenow', '42');
    expect(badge).toHaveTextContent('42');
  });

  it('exposes the fraction to CSS as --frac', () => {
    render(<DownloadBadge status="downloading" fraction={0.5} />);
    expect(screen.getByTestId('download-badge').getAttribute('style')).toContain('--frac: 0.5');
  });

  it('defaults a downloading badge with no fraction to 0%', () => {
    render(<DownloadBadge status="downloading" />);
    expect(screen.getByTestId('download-badge')).toHaveTextContent('0');
  });
});
