import { IonToggle, IonButton } from '@ionic/react';
import { useToast } from '../toast/useToast';
import { useDiagnostics } from './useDiagnostics';
import { DiagnosticsLog } from './DiagnosticsLog';
import './diagnostics.css';

/** Settings → Diagnostics. Opt-in playback logging to help diagnose audio issues.
 * Capture is on-device only; a separate "Upload" opt-in sends batches to the
 * cadence-logs backend. The upload endpoint is shown so it's visible in the UI
 * that a destination is configured. */
export function Diagnostics() {
  const d = useDiagnostics();
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(d.asText());
      toast('Diagnostics copied');
    } catch {
      toast('Couldn’t copy');
    }
  };

  return (
    <section className="diagnostics">
      <div className="diagnostics__row">
        <div className="diagnostics__text">
          <h2 className="diagnostics__title cad-kicker">Diagnostics</h2>
          <p className="cad-meta">Capture playback events on this device to debug audio issues.</p>
        </div>
        <IonToggle
          checked={d.enabled}
          onIonChange={(e) => d.setEnabled(e.detail.checked)}
          aria-label="Capture diagnostics"
          data-testid="diagnostics-toggle"
        />
      </div>

      {d.enabled && (
        <>
          <div className="diagnostics__row">
            <div className="diagnostics__text">
              <h3 className="cad-meta diagnostics__subtitle">Upload diagnostics</h3>
              <p className="cad-meta">
                {d.uploadConfigured
                  ? 'Send captured events so playback issues can be diagnosed.'
                  : 'No upload endpoint is configured in this build.'}
              </p>
              {d.uploadConfigured && (
                <p className="cad-meta diagnostics__endpoint" data-testid="diagnostics-endpoint">
                  Sending to: {d.endpoint}
                </p>
              )}
            </div>
            <IonToggle
              checked={d.uploadEnabled}
              disabled={!d.uploadConfigured}
              onIonChange={(e) => d.setUploadEnabled(e.detail.checked)}
              aria-label="Upload diagnostics"
              data-testid="diagnostics-upload-toggle"
            />
          </div>

          <div className="diagnostics__actions">
            <IonButton size="small" fill="outline" onClick={copy} data-testid="diagnostics-copy">
              Copy
            </IonButton>
            <IonButton
              size="small"
              fill="outline"
              onClick={d.clear}
              data-testid="diagnostics-clear"
            >
              Clear
            </IonButton>
          </div>
          <DiagnosticsLog entries={d.entries} />
        </>
      )}
    </section>
  );
}
