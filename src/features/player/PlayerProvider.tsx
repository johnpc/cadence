import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../lib/store';
import { PlayerContext } from './PlayerContext';
import { PlayerProgressContext } from './PlayerProgressContext';
import { createPlayerEngine } from './engine/createPlayerEngine';
import { browserEngineDeps } from './engine/browserEngineDeps';
import { attachIntegrations } from './integrations/attachIntegrations';
import { playerContextValue } from './playerContextValue';
import { useDiagnosticsContext } from './useDiagnosticsContext';
import { useEffectiveProgress } from '../cast/useEffectiveProgress';
import { refreshPlayDerivedShelves } from '../home/homeShelfRefresh';
import { useToast } from '../toast/useToast';
import type { PlayerEngine } from './engine/types';

/**
 * React's view of the playback engine. Creates the ONE engine (and its audio
 * element), starts it, attaches every integration, and publishes two contexts:
 * the player state + commands (changes only on real transitions) and the
 * fast-ticking progress (only the scrubbers read it). All behaviour lives in
 * engine/ and integrations/ — this file has no logic of its own.
 */
export function PlayerProvider({
  children,
  engine: injected,
}: {
  children: ReactNode;
  /** Tests hand in an engine built on fake platform deps. */
  engine?: PlayerEngine;
}) {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [engine] = useState(
    () => injected ?? createPlayerEngine(browserEngineDeps((m) => toastRef.current(m))),
  );
  const queryClient = useQueryClient();

  useEffect(() => engine.start(), [engine]);
  useEffect(
    () =>
      attachIntegrations(engine, {
        onReported: () => void refreshPlayDerivedShelves(queryClient),
      }),
    [engine, queryClient],
  );

  const state = useStore(engine.state);
  const value = useMemo(() => playerContextValue(state, engine), [state, engine]);
  useDiagnosticsContext(value.current);

  // While casting, the scrubber follows the receiver (the local element is silent).
  const local = useStore(engine.progress);
  const progress = useEffectiveProgress(local.position, local.duration);

  return (
    <PlayerContext.Provider value={value}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
}
