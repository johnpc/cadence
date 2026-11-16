import { IonIcon } from '@ionic/react';
import { tv } from 'ionicons/icons';
import { useCast } from './useCast';
import './castButton.css';

/** A small pill in the full player: "Casting to <device>" while a session is
 * active, so it's clear audio is going to the TV, and — for a few seconds after
 * the TV drops without the user stopping — "Lost connection to <device>", so the
 * jump back to the phone's speaker isn't a mystery. */
export function CastingBanner() {
  const { status, deviceName } = useCast();
  if (status === 'connected') {
    return (
      <div className="casting-banner" data-testid="casting-banner">
        <IonIcon icon={tv} />
        <span>Casting to {deviceName}</span>
      </div>
    );
  }
  if (status === 'lost') {
    return (
      <div
        className="casting-banner casting-banner--lost"
        data-testid="casting-lost-banner"
        role="status"
      >
        <IonIcon icon={tv} />
        <span>Lost connection to {deviceName}</span>
      </div>
    );
  }
  return null;
}
