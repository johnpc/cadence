import { useEffect, useRef } from 'react';
import { hasWatchBridge, pushWatchState } from './watchBridge';
import { imageUrl } from '../../lib/jellyfinStream';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { WatchState } from './watchTypes';

/**
 * Keep the paired Apple Watch's now-playing display in sync with the phone
 * player. Builds a small WatchState and pushes it to native (→ watch) whenever it
 * meaningfully changes. Position is rounded to whole seconds so a ticking
 * scrubber doesn't spam the bridge every frame. Inert off native iOS (no bridge).
 */
export function useWatchSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  position: number,
  duration: number,
): void {
  const native = hasWatchBridge();
  const last = useRef<string>('');

  useEffect(() => {
    if (!native) return;
    const state: WatchState = {
      title: current?.Name ?? '',
      artist: current ? artistLine(current) : '',
      artUrl: current ? imageUrl(current, 200) : null,
      isPlaying,
      position: Math.round(position),
      duration: Math.round(duration),
      hasTrack: !!current,
    };
    const key = JSON.stringify(state);
    if (key === last.current) return;
    last.current = key;
    pushWatchState(state);
  }, [native, current, isPlaying, position, duration]);
}
