import { createContext, useContext } from 'react';

/** Fast-changing playback progress (position/duration, updated several times a
 * second). Split from the main PlayerContext so the high-frequency ticks only
 * re-render the scrubbers that read them — not every TrackRow in a long list. */
export interface PlayerProgress {
  position: number;
  duration: number;
}

export const PlayerProgressContext = createContext<PlayerProgress | null>(null);

/** Playback position + duration (seconds). Only the scrubber UIs need this. */
export function usePlayerProgress(): PlayerProgress {
  const ctx = useContext(PlayerProgressContext);
  if (!ctx) throw new Error('usePlayerProgress must be used within a PlayerProvider');
  return ctx;
}
