import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/jellyfinPlayback', () => ({
  reportPlaybackStart: vi.fn(() => Promise.resolve()),
  reportPlaybackProgress: vi.fn(() => Promise.resolve()),
  reportPlaybackStopped: vi.fn(() => Promise.resolve()),
  savePlaybackPosition: vi.fn(() => Promise.resolve()),
  beaconPlaybackPosition: vi.fn(() => true),
}));
vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn().mockResolvedValue([]) }));
// Diagnostics context reads Auth + the route; it has its own test.
vi.mock('./useDiagnosticsContext', () => ({ useDiagnosticsContext: () => {} }));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerProvider } from './PlayerProvider';
import { usePlayer } from './usePlayer';
import { usePlayerProgress } from './PlayerProgressContext';
import { createPlayerEngine } from './engine/createPlayerEngine';
import { fakePlatform, track } from '../../test/engineHarness';
import { FakeAudio } from '../../test/fakeAudio';
import { setSession } from '../../lib/sessionStore';

function Probe() {
  const p = usePlayer();
  const { position } = usePlayerProgress();
  return (
    <div>
      <span data-testid="current">{p.current?.Name ?? '-'}</span>
      <span data-testid="playing">{String(p.isPlaying)}</span>
      <span data-testid="waiting">{String(p.waiting)}</span>
      <span data-testid="can-next">{String(p.canNext)}</span>
      <span data-testid="position">{position}</span>
      <button onClick={() => p.playQueue([track('a'), track('b')], 0)}>play</button>
      <button onClick={p.toggle}>toggle</button>
      <button onClick={p.next}>next</button>
    </div>
  );
}

function renderWith(engine?: ReturnType<typeof createPlayerEngine>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerProvider engine={engine}>
        <Probe />
      </PlayerProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // jsdom cannot load media; every element (incl. the prefetch buffer) is a fake.
  vi.stubGlobal(
    'Audio',
    vi.fn(() => new FakeAudio()),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  setSession(null);
});

describe('PlayerProvider', () => {
  it('publishes the engine state and commands through the contexts', async () => {
    const { deps, audio } = fakePlatform();
    const engine = createPlayerEngine(deps);
    renderWith(engine);
    expect(deps.attach).toHaveBeenCalled();
    await userEvent.click(screen.getByText('play'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song a');
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
    expect(screen.getByTestId('can-next')).toHaveTextContent('true');
    act(() => audio.fire('waiting'));
    expect(screen.getByTestId('waiting')).toHaveTextContent('true');
    act(() => audio.tick(7));
    expect(screen.getByTestId('position')).toHaveTextContent('7');
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    await userEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('current')).toHaveTextContent('Song b');
    expect(document.title).toBe('Song b');
  });

  it('unbinds the element and detaches integrations on unmount', () => {
    const { deps, audio } = fakePlatform();
    const { unmount } = renderWith(createPlayerEngine(deps));
    expect(audio.listenerCount('ended')).toBe(1);
    unmount();
    expect(audio.listenerCount('ended')).toBe(0);
    expect(document.title).toBe('Cadence');
  });

  it('builds its own engine on the real browser platform by default', async () => {
    setSession({ token: 't', userId: 'u' });
    const audio = new FakeAudio();
    audio.parentNode = document.body; // already attached — skip the DOM append
    let first = true;
    // The first element is the player's; later ones are the prefetch buffer.
    vi.stubGlobal(
      'Audio',
      vi.fn(() => {
        if (!first) return new FakeAudio();
        first = false;
        return audio;
      }),
    );
    renderWith();
    await userEvent.click(screen.getByText('play'));
    expect(audio.src).toContain('/Audio/a/universal');
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
  });
});
