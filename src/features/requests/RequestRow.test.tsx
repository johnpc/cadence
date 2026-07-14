import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RequestRow } from './RequestRow';
import type { LidarrArtist } from './lidarrTypes';

const artist: LidarrArtist = {
  artistName: 'Radiohead',
  foreignArtistId: 'mb-1',
  remotePoster: 'http://img/a.jpg',
};

describe('RequestRow', () => {
  it('shows the artist and requests on tap', async () => {
    const onRequest = vi.fn();
    render(<RequestRow artist={artist} status="idle" onRequest={onRequest} />);
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('request-button'));
    expect(onRequest).toHaveBeenCalledWith(artist);
  });

  it('shows a spinner (not the Request label) while requesting', () => {
    // IonButton's `disabled` isn't reflected to the DOM in jsdom (the web
    // component consumes it), so assert the observable in-flight signal: the
    // button shows a spinner instead of the "Request" text.
    const { container } = render(
      <RequestRow artist={artist} status="requesting" onRequest={vi.fn()} />,
    );
    expect(container.querySelector('ion-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('request-button')).not.toHaveTextContent('Request');
  });

  it('shows a "Requested" label (no button) once requested', () => {
    render(<RequestRow artist={artist} status="requested" onRequest={vi.fn()} />);
    expect(screen.getByTestId('request-done')).toHaveTextContent('Requested');
    expect(screen.queryByTestId('request-button')).not.toBeInTheDocument();
  });

  it('shows "In library" (no request button) when already owned', () => {
    render(<RequestRow artist={artist} status="idle" inLibrary onRequest={vi.fn()} />);
    expect(screen.getByTestId('request-in-library')).toHaveTextContent('In library');
    expect(screen.queryByTestId('request-button')).not.toBeInTheDocument();
  });

  it('renders a placeholder when the artist has no poster', () => {
    const { container } = render(
      <RequestRow
        artist={{ ...artist, remotePoster: undefined }}
        status="idle"
        onRequest={vi.fn()}
      />,
    );
    expect(container.querySelector('.request-row__art--empty')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
