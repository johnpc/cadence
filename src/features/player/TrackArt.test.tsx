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
