import { createContext } from 'react';
import type { PlayerContextValue } from './types';

/** Player context; consumed via usePlayer. Null until a provider mounts. */
export const PlayerContext = createContext<PlayerContextValue | null>(null);
