import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { PlayerContext } from '../features/player/PlayerContext';
import {
  PlayerProgressContext,
  type PlayerProgress,
} from '../features/player/PlayerProgressContext';
import type { PlayerContextValue } from '../features/player/types';

/** A no-op player context for components that consume usePlayer in tests. */
export function stubPlayer(overrides: Partial<PlayerContextValue> = {}): PlayerContextValue {
  return {
    current: null,
    isPlaying: false,
    waiting: false,
    shuffle: false,
    repeat: 'off',
    canNext: false,
    canPrev: false,
    queue: [],
    queueIndex: 0,
    playQueue: vi.fn(),
    playShuffled: vi.fn(),
    playNext: vi.fn(),
    addToQueue: vi.fn(),
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    jumpTo: vi.fn(),
    removeFromQueue: vi.fn(),
    moveInQueue: vi.fn(),
    clearQueue: vi.fn(),
    seek: vi.fn(),
    toggleShuffle: vi.fn(),
    cycleRepeat: vi.fn(),
    sleepMode: null,
    armSleep: vi.fn(),
    volume: 1,
    setVolume: vi.fn(),
    ...overrides,
  };
}

/** Render a UI tree inside the providers most feature components need:
 * a fresh QueryClient, a router, and a (stubbable) PlayerContext. */
export function renderWithProviders(
  ui: ReactElement,
  { player, progress }: { player?: PlayerContextValue; progress?: PlayerProgress } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlayerContext.Provider value={player ?? stubPlayer()}>
          <PlayerProgressContext.Provider value={progress ?? { position: 0, duration: 0 }}>
            {children}
          </PlayerProgressContext.Provider>
        </PlayerContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}
