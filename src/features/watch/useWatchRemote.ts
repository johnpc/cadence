import { useWatchSync } from './useWatchSync';
import { useWatchCommands } from './useWatchCommands';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The player pieces the watch remote needs — a superset of the objects already
 * assembled in PlayerProvider (audio controls + queue transport), so it wires in
 * one call without a fresh literal. */
interface WatchDeps {
  current: JellyfinItem | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  toggle: () => void;
  seekBy: (delta: number) => void;
  next: () => void;
  prev: () => void;
}

/**
 * Wire the Apple Watch remote: push now-playing state to the watch and handle the
 * transport commands it sends back. Bundles useWatchSync + useWatchCommands so
 * PlayerProvider wires the watch in one call (keeps it under the line gate). Both
 * halves no-op off native iOS.
 */
export function useWatchRemote(d: WatchDeps): void {
  useWatchSync(d.current, d.isPlaying, d.position, d.duration);
  useWatchCommands({ toggle: d.toggle, next: d.next, prev: d.prev, seekBy: d.seekBy });
}
