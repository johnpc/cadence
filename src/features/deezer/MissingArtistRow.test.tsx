import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingArtistRow } from './MissingArtistRow';

describe('MissingArtistRow', () => {
  it('shows the artist and requests on tap', async () => {
    const onRequest = vi.fn();
    render(<MissingArtistRow name="The Beatles" status="idle" onRequest={onRequest} />);
    expect(screen.getByText('The Beatles')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('deezer-missing-request'));
    expect(onRequest).toHaveBeenCalledWith('The Beatles');
  });

  it('shows a spinner while requesting', () => {
    const { container } = render(
      <MissingArtistRow name="The Beatles" status="requesting" onRequest={vi.fn()} />,
    );
    expect(container.querySelector('ion-spinner')).toBeInTheDocument();
  });

  it('shows "Requested" and no button once requested', () => {
    render(<MissingArtistRow name="The Beatles" status="requested" onRequest={vi.fn()} />);
    expect(screen.getByTestId('deezer-missing-done')).toBeInTheDocument();
    expect(screen.queryByTestId('deezer-missing-request')).not.toBeInTheDocument();
  });
});
