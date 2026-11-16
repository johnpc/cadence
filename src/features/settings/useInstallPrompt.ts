import { useStore } from '../../lib/store';
import { installPromptStore, promptInstall } from '../../lib/installPrompt';

/** Reactive install availability + the action to show the native prompt. */
export function useInstallPrompt() {
  const available = useStore(installPromptStore, (deferred) => deferred !== null);
  return { available, install: promptInstall };
}
