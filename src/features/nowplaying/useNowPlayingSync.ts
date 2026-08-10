import { useEffect, useRef } from 'react';
import { hasNowPlayingBridge, pushNowPlayingState } from './nowPlayingBridge';
import { imageUrl } from '../../lib/jellyfinStream';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { NowPlayingState } from './nowPlayingTypes';

/**
 * Keep the native iOS Now Playing registration (MPNowPlayingInfoCenter) in sync
 * with the web player. Builds a small NowPlayingState and pushes it to native
 * whenever it meaningfully changes. Position is rounded to whole seconds so the
 * ticking scrubber doesn't spam the bridge every frame (native interpolates
 * between updates via the playback rate). Inert off native iOS (no bridge).
 */
export function useNowPlayingSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  position: number,
  duration: number,
  queueIndex: number,
  queueCount: number,
): void {
  const native = hasNowPlayingBridge();
  const last = useRef<string>('');

  useEffect(() => {
    if (!native) return;
    const state: NowPlayingState = {
      title: current?.Name ?? '',
      artist: current ? artistLine(current) : '',
      album: current?.Album ?? '',
      artUrl: current ? imageUrl(current, 400) : null,
      isPlaying,
      position: Math.round(position),
      duration: Math.round(duration),
      hasTrack: !!current,
      queueIndex,
      queueCount,
    };
    const key = JSON.stringify(state);
    if (key === last.current) return;
    last.current = key;
    pushNowPlayingState(state);
  }, [native, current, isPlaying, position, duration, queueIndex, queueCount]);
}
