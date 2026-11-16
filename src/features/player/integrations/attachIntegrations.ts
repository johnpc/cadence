import { attachPlaybackReporting } from './playbackReporting';
import { attachEndlessPlay } from './endlessPlay';
import { attachNextTrackPrefetch } from './nextTrackPrefetch';
import { attachDocumentTitle } from './documentTitle';
import { attachInterruptionResume } from './interruptionResume';
import { attachAudioRouteLost } from './audioRouteLost';
import { attachMediaSession } from './mediaSessionSync';
import { attachNativeNowPlaying } from './nativeNowPlaying';
import { attachWatchRemote } from './watchRemote';
import { attachKeyboardShortcuts } from './keyboardShortcuts';
import type { PlayerEngine } from '../engine/types';

/**
 * Every subscriber of the player, in one list. Each one only reads the engine's
 * state and calls its commands — adding a surface (a widget, a new remote) is
 * one more line here, not another hook threaded through PlayerProvider.
 */
export function attachIntegrations(
  engine: PlayerEngine,
  opts: { onReported: () => void },
): () => void {
  const detach = [
    attachPlaybackReporting(engine, opts.onReported),
    attachEndlessPlay(engine),
    attachNextTrackPrefetch(engine),
    attachDocumentTitle(engine),
    attachInterruptionResume(engine),
    attachAudioRouteLost(engine),
    attachMediaSession(engine),
    attachNativeNowPlaying(engine),
    attachWatchRemote(engine),
    attachKeyboardShortcuts(engine),
  ];
  return () => detach.forEach((off) => off());
}
