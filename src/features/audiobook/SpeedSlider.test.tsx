import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpeedSlider } from './SpeedSlider';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const song = { Id: 's', Name: 'Song', Type: 'Audio' } as JellyfinItem;

describe('SpeedSlider', () => {
  it('renders nothing for a music track', () => {
    const { container } = renderWithProviders(<SpeedSlider />, {
      player: stubPlayer({ current: song }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current speed and updates it on slider input (books only)', () => {
    const setRate = vi.fn();
    renderWithProviders(<SpeedSlider />, {
      player: stubPlayer({ current: book, rate: 1.5, setRate }),
    });
    expect(screen.getByTestId('speed-value')).toHaveTextContent('1.5×');
    const range = screen.getByLabelText('Playback speed') as HTMLInputElement;
    expect(range.min).toBe('0.5');
    expect(range.max).toBe('3');
    expect(range.step).toBe('0.25');
    fireEvent.change(range, { target: { value: '2' } });
    expect(setRate).toHaveBeenCalledWith(2);
  });
});
