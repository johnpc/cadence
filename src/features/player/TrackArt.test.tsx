import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TrackArt } from './TrackArt';
import { setSession } from '../../lib/sessionStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('TrackArt', () => {
  afterEach(() => setSession(null));

  it('renders an img when the item has art', () => {
    setSession({ token: 't', userId: 'u' });
    const item: JellyfinItem = { Id: 'i', Name: 'x', Type: 'Audio', ImageTags: { Primary: 'p' } };
    const { container } = render(<TrackArt item={item} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders a placeholder icon when there is no art', () => {
    const { container } = render(<TrackArt item={null} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('ion-icon')).toBeInTheDocument();
  });

  it('applies the round modifier when asked', () => {
    const { container } = render(<TrackArt item={null} round />);
    expect(container.querySelector('.track-art--round')).toBeInTheDocument();
  });

  it('fades the image in only once it has loaded', () => {
    setSession({ token: 't', userId: 'u' });
    const item: JellyfinItem = { Id: 'i', Name: 'x', Type: 'Audio', ImageTags: { Primary: 'p' } };
    const { container } = render(<TrackArt item={item} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.className).not.toContain('track-art__img--loaded'); // faded out
    fireEvent.load(img);
    expect(img.className).toContain('track-art__img--loaded'); // faded in
  });

  it('falls back to the placeholder when the image fails to load', () => {
    setSession({ token: 't', userId: 'u' });
    const item: JellyfinItem = { Id: 'i', Name: 'x', Type: 'Audio', ImageTags: { Primary: 'p' } };
    const { container } = render(<TrackArt item={item} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    fireEvent.error(img as HTMLImageElement);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('ion-icon')).toBeInTheDocument();
  });
});
