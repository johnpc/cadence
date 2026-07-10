import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/platform', () => ({ hasSoftwareVolume: vi.fn() }));
import { VolumeSlider } from './VolumeSlider';
import { hasSoftwareVolume } from '../../lib/platform';

afterEach(() => {
  vi.resetAllMocks();
});

describe('VolumeSlider', () => {
  it('renders the slider where software volume works', () => {
    vi.mocked(hasSoftwareVolume).mockReturnValue(true);
    render(<VolumeSlider volume={0.5} setVolume={vi.fn()} />);
    expect(screen.getByTestId('full-player-volume')).toBeInTheDocument();
  });

  it('renders nothing on iOS (no software volume)', () => {
    vi.mocked(hasSoftwareVolume).mockReturnValue(false);
    const { container } = render(<VolumeSlider volume={0.5} setVolume={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reports slider changes through setVolume', () => {
    vi.mocked(hasSoftwareVolume).mockReturnValue(true);
    const setVolume = vi.fn();
    render(<VolumeSlider volume={0.2} setVolume={setVolume} />);
    fireEvent.change(screen.getByTestId('full-player-volume'), { target: { value: '0.8' } });
    expect(setVolume).toHaveBeenCalledWith(0.8);
  });
});
