import { IonIcon } from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { useToast } from '../toast/useToast';
import { copyShareLink } from './shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './shareButton.css';

/** A share icon that copies the item's app link to the clipboard, with a toast.
 * Renders nothing until the item has loaded. */
export function ShareButton({ item, size = 24 }: { item: JellyfinItem | null; size?: number }) {
  const toast = useToast();
  if (!item) return null;
  return (
    <button
      type="button"
      className="share-btn"
      style={{ fontSize: size }}
      data-testid="share-button"
      aria-label="Copy link"
      onClick={(e) => {
        e.stopPropagation();
        void copyShareLink(item, window.location.origin).then((ok) =>
          toast(ok ? 'Link copied' : 'Could not copy link'),
        );
      }}
    >
      <IonIcon icon={shareOutline} />
    </button>
  );
}
