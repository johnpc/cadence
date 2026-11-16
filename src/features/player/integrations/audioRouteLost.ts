import { log } from '../../../lib/diagnostics/diagnosticsStore';
import type { PlayerEngine } from '../engine/types';

/** Dispatched by the iOS app (AppDelegate.handleRouteChange) when the private
 * output the user was listening on goes away: headphones unplugged, Bluetooth /
 * AirPods disconnected, CarPlay or AirPlay ended (see AudioRouteLoss.swift). */
export const AUDIO_ROUTE_LOST = 'cadence:audioroutelost';

/**
 * Pause when headphones or Bluetooth disconnect, like Apple's media apps —
 * instead of carrying on out of the phone speaker. A deliberate (directional)
 * pause: it clears play intent, so the interruption-resume nudge that follows a
 * route change never restarts playback on the speaker. Inert on the web (the
 * event never fires; browsers handle this themselves).
 */
export function attachAudioRouteLost(engine: Pick<PlayerEngine, 'pause'>): () => void {
  const onLost = () => {
    log('route', 'output lost — pausing');
    engine.pause();
  };
  window.addEventListener(AUDIO_ROUTE_LOST, onLost);
  return () => window.removeEventListener(AUDIO_ROUTE_LOST, onLost);
}
