import { IonIcon } from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { useToast } from '../toast/useToast';
import { shareItem } from './shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './shareButton.css';

/** A share button: opens the OS share sheet where available (mobile), otherwise
 * copies the item's app link — with a matching toast. Renders nothing until the
 * item has loaded. */
export function ShareButton({ item, size = 24 }: { item: JellyfinItem | null; size?: number }) {
  const toast = useToast();
  if (!item) return null;
  return (
    <button
      type="button"
      className="share-btn"
      style={{ fontSize: size }}
      data-testid="share-button"
      aria-label="Share"
      onClick={(e) => {
        e.stopPropagation();
        void shareItem(item, window.location.origin).then((r) => {
          // 'failed' is usually a dismissed share sheet — stay silent there.
          if (r === 'shared') toast('Shared');
          else if (r === 'copied') toast('Link copied');
        });
      }}
    >
      <IonIcon icon={shareOutline} />
    </button>
  );
}
