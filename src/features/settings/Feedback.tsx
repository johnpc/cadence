import { IonIcon } from '@ionic/react';
import { bugOutline, bulbOutline, chevronForward } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { feedbackUrl } from './feedbackUrl';
import './feedback.css';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/** Settings "Feedback" section: open a prefilled GitHub issue to report a bug or
 * request a feature. The report carries the app version + platform so it's
 * actionable; opened via the in-app browser (native) / a new tab (web). */
export function Feedback() {
  const open = (kind: 'bug' | 'feature') =>
    void Browser.open({ url: feedbackUrl(kind, APP_VERSION) }).catch(() => undefined);

  return (
    <section className="settings__feedback">
      <h2 className="settings__title cad-kicker">Feedback</h2>
      <button
        type="button"
        className="feedback__row"
        data-testid="report-bug"
        onClick={() => open('bug')}
      >
        <IonIcon icon={bugOutline} aria-hidden="true" />
        <span className="feedback__label">Report a bug</span>
        <IonIcon icon={chevronForward} aria-hidden="true" className="feedback__chevron" />
      </button>
      <button
        type="button"
        className="feedback__row"
        data-testid="request-feature"
        onClick={() => open('feature')}
      >
        <IonIcon icon={bulbOutline} aria-hidden="true" />
        <span className="feedback__label">Request a feature</span>
        <IonIcon icon={chevronForward} aria-hidden="true" className="feedback__chevron" />
      </button>
    </section>
  );
}
