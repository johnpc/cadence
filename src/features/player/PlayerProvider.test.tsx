import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/jellyfinPlayback', () => ({
  reportPlaybackStart: vi.fn(),
  reportPlaybackProgress: vi.fn(),
  reportPlaybackStopped: vi.fn(),
}));
vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn().mockResolvedValue([]) }));
import { PlayerProvider } from './PlayerProvider';
import { usePlayer } from './usePlayer';
import { setSession } from '../../lib/sessionStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// A controllable fake HTMLAudioElement — jsdom can't decode audio.
class FakeAudio {
  parentNode = document.body;
  setAttribute() {}
  removeAttribute() {
    this.src = '';
  }
  load() {}
  src = '';
  preload = '';
  muted = false;
  paused = true;
  currentTime = 0;
  duration = 0;
  private handlers: Record<string, Array<() => void>> = {};
  addEventListener(type: string, fn: () => void) {
    (this.handlers[type] ??= []).push(fn);
  }
  removeEventListener() {}
  play() {
    this.paused = false;
    this.fire('play');
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.fire('pause');
  }
  fire(type: string) {
    (this.handlers[type] ?? []).forEach((fn) => fn());
  }
}

let audio: FakeAudio;
const track = (id: string): JellyfinItem => ({ Id: id, Name: `Song ${id}`, Type: 'Audio' });

function Probe() {
  const p = usePlayer();
  return (
    <div>
      <span data-testid="current">{p.current?.Name ?? '-'}</span>
      <span data-testid="playing">{String(p.isPlaying)}</span>
      <button onClick={() => p.playQueue([track('a'), track('b')], 0)}>play</button>
      <button onClick={p.toggle}>toggle</button>
      <button onClick={p.next}>next</button>
      <button onClick={p.prev}>prev</button>
      <button onClick={() => p.seek(42)}>seek</button>
      <button onClick={p.toggleShuffle}>shuffle</button>
      <span data-testid="shuffle">{String(p.shuffle)}</span>
    </div>
  );
}

describe('PlayerProvider', () => {
  beforeEach(() => {
    setSession({ token: 't', userId: 'u' });
    audio = new FakeAudio();
    // First construction is the main element; later ones are the prefetch
    // hook's throwaway buffers (must not clobber the main element's src).
    let first = true;
    vi.stubGlobal(
      'Audio',
      vi.fn(() => {
        if (first) {
          first = false;
          return audio;
        }
        return new FakeAudio();
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setSession(null);
  });

  it('plays a queue: loads the first track src and marks playing', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song a');
    expect(audio.src).toContain('/Audio/a/universal');
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
  });

  it('advances to the next track when the current one ends', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    act(() => audio.fire('ended'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
    expect(audio.src).toContain('/Audio/b/universal');
  });

  it('skips to the next track when the current one fails to load', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    act(() => audio.fire('error'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
  });

  it('prev restarts the current track when more than a few seconds in', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    // advance to the 2nd track so "previous" would have somewhere to go
    await userEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
    audio.currentTime = 30; // deep into the track
    await userEvent.click(screen.getByText('prev'));
    // restarts in place rather than going back to Song a
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
    expect(audio.currentTime).toBe(0);
  });

  it('prev goes to the previous track near the start', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    await userEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
    audio.currentTime = 1; // just started
    await userEvent.click(screen.getByText('prev'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song a');
  });

  it('toggles pause/resume', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
  });

  it('seeks the audio element', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    await userEvent.click(screen.getByText('seek'));
    expect(audio.currentTime).toBe(42);
  });

  it('toggles shuffle on and off', async () => {
    render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
    await userEvent.click(screen.getByText('play'));
    await userEvent.click(screen.getByText('shuffle'));
    expect(screen.getByTestId('shuffle')).toHaveTextContent('true');
    await userEvent.click(screen.getByText('shuffle'));
    expect(screen.getByTestId('shuffle')).toHaveTextContent('false');
  });
});
