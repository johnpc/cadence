import { type RefObject } from 'react';
import { useTrackLoader } from './useTrackLoader';
import { useAudiobookResume } from '../audiobook/useAudiobookResume';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Load the current track into the audio element and, for audiobooks, silently
 * resume where the listener left off. Bundles the two track-load concerns so
 * PlayerProvider wires them in one call: useTrackLoader points the element at the
 * track (restored tracks stay paused; `reloadNonce` forces a re-derive+retry
 * after a load error), then useAudiobookResume seeks back to the saved position
 * for audiobooks only (music is untouched).
 */
export function useTrackPlayback(
  ref: RefObject<HTMLAudioElement | null>,
  current: JellyfinItem | null | undefined,
  reloadNonce: number,
): void {
  useTrackLoader(ref, current ?? undefined, reloadNonce);
  useAudiobookResume(ref, current);
}
