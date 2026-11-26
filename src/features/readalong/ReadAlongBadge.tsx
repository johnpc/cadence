import { IonIcon } from '@ionic/react';
import { bookOutline, hourglassOutline } from 'ionicons/icons';
import type { ReadAlongStatus } from './storytellerApi';
import { badgeFor } from './readAlongLibrary';
import './readAlongBadge.css';

/** "Read along" (ready) or "Aligning…" (Storyteller still syncing) next to a
 * book's meta line; renders nothing for any other status. On a narrow phone a
 * book row shows just the icon (the label stays for screen readers). */
export function ReadAlongBadge({ status }: { status: ReadAlongStatus | undefined }) {
  const badge = badgeFor(status);
  if (!badge) return null;
  return (
    <span
      className={`readalong-badge readalong-badge--${badge.kind}`}
      data-testid="readalong-badge"
      data-status={badge.kind}
    >
      <IonIcon icon={badge.kind === 'ready' ? bookOutline : hourglassOutline} aria-hidden="true" />
      <span className="readalong-badge__label">{badge.label}</span>
    </span>
  );
}
