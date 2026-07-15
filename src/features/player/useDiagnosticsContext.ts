import { useEffect } from 'react';
import { setLogContext, log } from '../../lib/diagnostics/diagnosticsStore';
import { isIos } from '../../lib/platform';
import { useAuth } from '../auth/useAuth';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The current in-app route for diagnostics. Read from the URL directly (NOT
 * react-router's useLocation) because PlayerProvider mounts OUTSIDE the Router in
 * the app tree — using the hook here would throw at boot. Ionic routes live in the
 * path (hash for the PWA fallback), so prefer the hash when present. */
function currentPage(): string {
  if (typeof window === 'undefined') return '';
  const { hash, pathname } = window.location;
  return hash && hash.length > 1 ? hash.slice(1) : pathname;
}

/** Keep the diagnostics ambient context in sync so EVERY logged event carries the
 * who/what/where needed to diagnose: the signed-in user, the current route (page),
 * the platform, and the current track (title/artist/id). Without this the logs are
 * bare categories that can't be correlated. Also emits a 'track-change' event with
 * full metadata when the song changes. */
export function useDiagnosticsContext(current: JellyfinItem | null): void {
  const { username } = useAuth();
  const id = current?.Id;
  useEffect(() => {
    setLogContext({
      platform: isIos() ? 'ios' : 'web',
      user: username ?? 'anon',
      page: currentPage(),
      ...(current
        ? { trackId: current.Id ?? '', title: current.Name ?? '', artist: artistLine(current) }
        : {}),
    });
  }, [id, current, username]);

  useEffect(() => {
    if (!current) return;
    log('track-change', 'now playing', {
      title: current.Name ?? '',
      artist: artistLine(current),
      album: current.Album ?? '',
    });
  }, [id, current]);
}
