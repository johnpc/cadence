import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({ imageUrl: (i: { Id: string }) => `img:${i.Id}` }));
const color = vi.fn<[string | null], string | null>(() => null);
vi.mock('../color/useDominantColor', () => ({
  useDominantColor: (src: string | null) => color(src),
}));

import { AmbientBackground } from './AmbientBackground';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item: JellyfinItem = { Id: 'i', Name: 'x', Type: 'Audio', ImageTags: { Primary: 'p' } };

describe('AmbientBackground', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // jsdom's CSSOM drops linear-gradient() from the `background` shorthand, so
  // the observable signal that the wash applied is the inline opacity (only set
  // to 1 once a colour resolves; unset — faded out by CSS — until then).
  it('renders an aria-hidden layer faded out until the colour resolves', () => {
    color.mockReturnValue(null);
    const { getByTestId } = render(<AmbientBackground item={item} />);
    const el = getByTestId('ambient-bg');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.style.opacity).toBe('');
  });

  it('washes in (opacity 1) once the colour resolves', () => {
    color.mockReturnValue('rgb(10, 20, 30)');
    const { getByTestId } = render(<AmbientBackground item={item} />);
    expect(getByTestId('ambient-bg').style.opacity).toBe('1');
  });

  it('samples from the current item art url', () => {
    render(<AmbientBackground item={item} />);
    expect(color).toHaveBeenCalledWith('img:i');
  });

  it('passes null through when there is no track', () => {
    render(<AmbientBackground item={null} />);
    expect(color).toHaveBeenCalledWith(null);
  });
});
