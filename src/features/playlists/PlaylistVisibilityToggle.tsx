import { IonIcon } from '@ionic/react';
import { globeOutline, lockClosedOutline } from 'ionicons/icons';
import { usePlaylistVisibility } from './usePlaylistVisibility';
import './playlistVisibility.css';

/** Owner-only public/private control for a playlist. Public → appears in the
 * community shelf and others can add it to their library; Private → only in the
 * owner's library. Reads the current state (OpenAccess) and flips it via
 * IsPublic. Renders nothing for non-owners (`owned` false). */
export function PlaylistVisibilityToggle({
  playlistId,
  owned,
}: {
  playlistId: string;
  owned: boolean;
}) {
  const { isPublic, isLoading, setPublic, busy } = usePlaylistVisibility(playlistId, owned);
  if (!owned || isLoading) return null;
  return (
    <div className="pl-visibility" role="group" aria-label="Playlist visibility">
      <button
        type="button"
        className={isPublic ? 'pl-visibility__opt' : 'pl-visibility__opt pl-visibility__opt--on'}
        aria-pressed={!isPublic}
        disabled={busy}
        data-testid="playlist-private"
        onClick={() => setPublic(false)}
      >
        <IonIcon icon={lockClosedOutline} aria-hidden="true" /> Private
      </button>
      <button
        type="button"
        className={isPublic ? 'pl-visibility__opt pl-visibility__opt--on' : 'pl-visibility__opt'}
        aria-pressed={isPublic}
        disabled={busy}
        data-testid="playlist-public"
        onClick={() => setPublic(true)}
      >
        <IonIcon icon={globeOutline} aria-hidden="true" /> Public
      </button>
    </div>
  );
}
