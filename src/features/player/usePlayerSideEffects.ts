import { type RefObject } from 'react';
import { usePlaybackReporting } from './usePlaybackReporting';
import { useEndlessPlay } from './useEndlessPlay';
import { useNextTrackPrefetch } from './useNextTrackPrefetch';
import { useDocumentTitle } from './useDocumentTitle';
import { useAutoplay } from '../settings/useAutoplay';
import type { usePlayerQueue } from './usePlayerQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The player's fire-and-forget integrations — hooks that observe playback and
 * produce side effects but return nothing the render needs: report plays to
 * Jellyfin, append instant-mix radio when the queue runs dry, warm the next
 * track for gapless transitions, and reflect the track in the tab title.
 * Grouped out of PlayerProvider so it stays a thin composition root.
 */
export function usePlayerSideEffects(
  qh: ReturnType<typeof usePlayerQueue>,
  current: JellyfinItem | null,
  currentId: string | undefined,
  ref: RefObject<HTMLAudioElement | null>,
  isPlaying: boolean,
): void {
  // Report playback to Jellyfin (play counts + Recently Played). Reads position
  // live from the audio element so it doesn't re-fire on every tick.
  usePlaybackReporting(currentId, () => ref.current?.currentTime ?? 0);

  // Endless play: append instant-mix radio when the queue ends (unless the user
  // turned Autoplay off, or repeat is on — then the queue loops instead).
  const { autoplay } = useAutoplay();
  useEndlessPlay(qh.queue.tracks, qh.queue.index, autoplay && qh.repeat === 'off', qh.addToQueue);

  // Warm the next track (web audio path only) so transitions are near-gapless.
  useNextTrackPrefetch(qh.queue, qh.repeat === 'all', isPlaying);

  // Reflect the playing track in the browser tab title.
  useDocumentTitle(current);
}
