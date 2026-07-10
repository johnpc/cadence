import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayingFrom } from './PlayingFrom';
import { setPlayContext } from './playContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => setPlayContext(null));

describe('PlayingFrom', () => {
  it('renders nothing when there is no context', () => {
    const { container } = render(<PlayingFrom trackId="a" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the "Playing from <kind> · <label>" header for a track in the collection', () => {
    setPlayContext({ kind: 'playlist', label: 'Chill Mix', tracks: [t('a'), t('b')] });
    render(<PlayingFrom trackId="a" />);
    expect(screen.getByTestId('playing-from')).toHaveTextContent('Playing from playlist');
    expect(screen.getByTestId('playing-from')).toHaveTextContent('Chill Mix');
  });

  it('hides once the current track leaves the collection (endless radio)', () => {
    setPlayContext({ kind: 'album', label: 'Rent', tracks: [t('a')] });
    render(<PlayingFrom trackId="z" />);
    expect(screen.queryByTestId('playing-from')).not.toBeInTheDocument();
  });

  it('links the label back to the source and closes the player on tap', async () => {
    setPlayContext({
      kind: 'playlist',
      label: 'Chill Mix',
      path: '/playlist/p1',
      tracks: [t('a')],
    });
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <PlayingFrom trackId="a" onNavigate={onNavigate} />
      </MemoryRouter>,
    );
    const link = screen.getByTestId('playing-from-link');
    expect(link).toHaveAttribute('href', '/playlist/p1');
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it('renders a plain (non-link) label when the context has no path', () => {
    setPlayContext({ kind: 'genre', label: 'Jazz', tracks: [t('a')] });
    render(<PlayingFrom trackId="a" />);
    expect(screen.getByTestId('playing-from')).toHaveTextContent('Jazz');
    expect(screen.queryByTestId('playing-from-link')).not.toBeInTheDocument();
  });
});
