import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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
});
