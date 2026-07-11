import { useEffect, useState } from 'react';
import { usePlayer } from './usePlayer';
import { nowPlayingAnnouncement } from './nowPlayingAnnouncement';

/** A visually-hidden aria-live region that speaks the current track whenever it
 * changes — next/prev/ended/queue changes are otherwise silent to screen
 * readers, so a user never hears what's now playing. Polite so it doesn't
 * interrupt. Keyed on the track id so it announces only on a real change, not on
 * every re-render. Always mounted (unlike the mini-bar, which hides when idle).*/
export function NowPlayingAnnouncer() {
  const { current } = usePlayer();
  const [message, setMessage] = useState('');
  const id = current?.Id;

  useEffect(() => {
    setMessage(nowPlayingAnnouncement(current));
    // Announce only when the track identity changes, not on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div
      className="cad-sr-only"
      role="status"
      aria-live="polite"
      data-testid="now-playing-announcer"
    >
      {message}
    </div>
  );
}
