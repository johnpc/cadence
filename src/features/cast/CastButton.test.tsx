import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useCast', () => ({ useCast: vi.fn() }));
vi.mock('../player/usePlayer', () => ({ usePlayer: vi.fn() }));
import { useCast } from './useCast';
import { usePlayer } from '../player/usePlayer';
import { CastButton } from './CastButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'x' } as JellyfinItem;
const useCastMock = (over: Partial<ReturnType<typeof useCast>>) =>
  vi.mocked(useCast).mockReturnValue({
    available: true,
    connected: false,
    deviceName: '',
    cast: vi.fn(),
    stop: vi.fn(),
    ...over,
  });

describe('CastButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing where cast is unavailable (web MVP)', () => {
    useCastMock({ available: false });
    vi.mocked(usePlayer).mockReturnValue({ current: track } as ReturnType<typeof usePlayer>);
    const { container } = render(<CastButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('casts the current track when tapped while disconnected', async () => {
    const cast = vi.fn();
    useCastMock({ available: true, connected: false, cast });
    vi.mocked(usePlayer).mockReturnValue({ current: track } as ReturnType<typeof usePlayer>);
    render(<CastButton />);
    await userEvent.click(screen.getByTestId('cast-button'));
    expect(cast).toHaveBeenCalledWith(track);
  });

  it('stops casting when tapped while connected, and reflects pressed state', async () => {
    const stop = vi.fn();
    useCastMock({ available: true, connected: true, deviceName: 'Shield', stop });
    vi.mocked(usePlayer).mockReturnValue({ current: track } as ReturnType<typeof usePlayer>);
    render(<CastButton />);
    const btn = screen.getByTestId('cast-button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(stop).toHaveBeenCalledOnce();
  });
});
