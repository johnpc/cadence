import { useEffect } from 'react';
import { usePlayer } from '../player/usePlayer';
import { useCast } from './useCast';
import { sendNowPlaying, sendQueue } from './castBroadcast';

/**
 * While casting to a custom receiver, mirror the app's now-playing + queue to
 * the TV. Fires when the current track, play state, or queue changes. The
 * broadcast helpers are themselves no-ops unless connected to a custom receiver,
 * so this hook is safe to mount unconditionally (it does nothing on web / with
 * the default receiver).
 */
export function useCastSync(): void {
  const { current, isPlaying, queue, queueIndex } = usePlayer();
  const { connected } = useCast();

  useEffect(() => {
    if (connected && current) void sendNowPlaying(current, isPlaying);
  }, [connected, current, isPlaying]);

  useEffect(() => {
    if (connected) void sendQueue(queue, queueIndex);
  }, [connected, queue, queueIndex]);
}
