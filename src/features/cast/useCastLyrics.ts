import { useEffect } from 'react';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { useCast } from './useCast';
import { useLyrics } from '../player/useLyrics';
import { activeLineIndex } from '../player/activeLyric';
import { sendLyrics } from './castBroadcast';

/**
 * While casting to a custom receiver, mirror the current track's lyrics (and the
 * active line, karaoke-style) to the TV. Fetches lyrics only while casting
 * (enabled = connected) so it costs nothing otherwise, and re-sends whenever the
 * lines or the active line change (keyed on `active`, not the raw position, so
 * it fires per lyric line — not on every position tick). sendLyrics is a no-op
 * unless connected to a custom receiver, so this is safe to mount always.
 */
export function useCastLyrics(): void {
  const { current } = usePlayer();
  const { connected } = useCast();
  const { position } = usePlayerProgress();
  const { lines } = useLyrics(current?.Id, connected);
  const active = activeLineIndex(lines, position);

  useEffect(() => {
    if (connected && lines.length) void sendLyrics(lines, active);
  }, [connected, lines, active]);
}
