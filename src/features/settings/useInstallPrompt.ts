import { useEffect, useState } from 'react';
import { canInstall, onInstallAvailability, promptInstall } from '../../lib/installPrompt';

/** Reactive install availability + the action to show the native prompt. */
export function useInstallPrompt() {
  const [available, setAvailable] = useState(canInstall);
  useEffect(() => onInstallAvailability(setAvailable), []);
  return { available, install: promptInstall };
}
