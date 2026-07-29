import { IonButton, IonIcon } from '@ionic/react';
import { cloudDownloadOutline } from 'ionicons/icons';
import { useState } from 'react';
import { musicGrabberConfigured } from '../../lib/musicGrabberStore';
import { GrabSheet } from './GrabSheet';
import './grab.css';

/** "Not in your library? Grab it" — shown under an empty Search when a Music
 * Grabber service is configured. Opens the Grab sheet pre-seeded with the query,
 * so a fruitless search flows straight into acquiring the missing track. Renders
 * nothing when Grab isn't configured (URL unset in Settings/env). */
export function GrabPrompt({ query, show }: { query: string; show: boolean }) {
  const [open, setOpen] = useState(false);
  if (!show || !query.trim() || !musicGrabberConfigured()) return null;
  return (
    <div className="grab-prompt" data-testid="search-grab-prompt">
      <p className="grab-prompt__text cad-meta">Not in your library?</p>
      <IonButton
        size="small"
        fill="outline"
        onClick={() => setOpen(true)}
        data-testid="search-grab-cta"
      >
        <IonIcon slot="start" icon={cloudDownloadOutline} />
        Grab “{query.trim()}”
      </IonButton>
      <GrabSheet query={query} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
