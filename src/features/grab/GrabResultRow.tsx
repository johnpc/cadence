import { IonButton, IonSpinner } from '@ionic/react';
import { qualityBadge, formatDuration } from './qualityBadge';
import type { GrabResult } from './grabTypes';
import './grab.css';

/** One Music Grabber search result: thumbnail, title, artist/channel, a
 * quality badge + source chip, and a Grab button (a spinner while its own
 * download runs). */
export function GrabResultRow({
  result,
  busy,
  disabled,
  onGrab,
}: {
  result: GrabResult;
  busy: boolean;
  disabled: boolean;
  onGrab: () => void;
}) {
  const q = qualityBadge(result);
  const duration = formatDuration(result.duration);
  const artist = result.artist ?? result.channel ?? '';
  return (
    <div className="grab-row" data-testid="grab-result">
      {result.thumbnail && (
        <img className="grab-row__art" src={result.thumbnail} alt="" loading="lazy" />
      )}
      <span className="grab-row__meta">
        <span className="grab-row__title">{result.title}</span>
        <span className="grab-row__sub cad-meta">
          {artist}
          {duration && ` · ${duration}`}
        </span>
        <span className="grab-row__badges">
          <span className={q.lossless ? 'grab-chip grab-chip--lossless' : 'grab-chip'}>
            {q.label}
          </span>
          <span className="grab-chip grab-chip--source">{result.source}</span>
        </span>
      </span>
      <IonButton
        size="small"
        fill="outline"
        onClick={onGrab}
        disabled={disabled}
        data-testid="grab-button"
        aria-label={`Grab ${result.title}`}
      >
        {busy ? <IonSpinner name="crescent" /> : 'Grab'}
      </IonButton>
    </div>
  );
}
