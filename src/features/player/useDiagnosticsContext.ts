import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setLogContext, log } from '../../lib/diagnostics/diagnosticsStore';
import { isIos } from '../../lib/platform';
import { useAuth } from '../auth/useAuth';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Keep the diagnostics ambient context in sync so EVERY logged event carries the
 * who/what/where needed to diagnose: the signed-in user, the current route (page),
 * the platform, and the current track (title/artist/id). Without this the logs are
 * bare categories that can't be correlated. Also emits a 'track-change' event with
 * full metadata when the song changes. */
export function useDiagnosticsContext(current: JellyfinItem | null): void {
  const { username } = useAuth();
  const { pathname } = useLocation();
  const id = current?.Id;
  useEffect(() => {
    setLogContext({
      platform: isIos() ? 'ios' : 'web',
      user: username ?? 'anon',
      page: pathname,
      ...(current
        ? { trackId: current.Id ?? '', title: current.Name ?? '', artist: artistLine(current) }
        : {}),
    });
  }, [id, current, username, pathname]);

  useEffect(() => {
    if (!current) return;
    log('track-change', 'now playing', {
      title: current.Name ?? '',
      artist: artistLine(current),
      album: current.Album ?? '',
    });
  }, [id, current]);
}
