import { IonIcon } from '@ionic/react';
import { tv } from 'ionicons/icons';
import { useCast } from './useCast';
import './castButton.css';

/** A small "Casting to <device>" pill shown in the full player while a cast
 * session is active, so it's clear audio is going to the TV, not the phone. */
export function CastingBanner() {
  const { connected, deviceName } = useCast();
  if (!connected) return null;
  return (
    <div className="casting-banner" data-testid="casting-banner">
      <IonIcon icon={tv} />
      <span>Casting to {deviceName}</span>
    </div>
  );
}
