import { useContext } from 'react';
import { PlayerContext } from './PlayerContext';
import type { PlayerContextValue } from './types';

/** Access the player state + controls. Must be used within a PlayerProvider. */
export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}
