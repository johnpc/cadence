import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GrabResultRow } from './GrabResultRow';
import type { GrabResult } from './grabTypes';

const result: GrabResult = {
  video_id: 'v1',
  title: 'Creep',
  channel: 'Radiohead',
  artist: null,
  duration: 238,
  thumbnail: null,
  source: 'youtube',
  source_url: 'u',
  quality_score: 150,
  is_playlist: false,
  album: null,
};

describe('GrabResultRow', () => {
  it('shows title, artist, duration, quality + source', () => {
    render(<GrabResultRow result={result} busy={false} disabled={false} onGrab={vi.fn()} />);
    expect(screen.getByText('Creep')).toBeInTheDocument();
    expect(screen.getByText(/Radiohead/)).toBeInTheDocument();
    expect(screen.getByText(/3:58/)).toBeInTheDocument();
    expect(screen.getByText('Lossless')).toBeInTheDocument();
    expect(screen.getByText('youtube')).toBeInTheDocument();
  });

  it('fires onGrab when tapped', async () => {
    const onGrab = vi.fn();
    render(<GrabResultRow result={result} busy={false} disabled={false} onGrab={onGrab} />);
    await userEvent.click(screen.getByTestId('grab-button'));
    expect(onGrab).toHaveBeenCalled();
  });

  it('shows a spinner (not the Grab label) while busy', () => {
    render(<GrabResultRow result={result} busy disabled onGrab={vi.fn()} />);
    const btn = screen.getByTestId('grab-button');
    // jsdom doesn't run Ionic's shadow rendering, so IonButton's `disabled` isn't
    // a queryable attribute — assert the visible busy state: a spinner replaces
    // the "Grab" label.
    expect(btn.querySelector('ion-spinner')).toBeTruthy();
    expect(btn).not.toHaveTextContent('Grab');
  });
});
