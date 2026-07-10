import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Fire-and-forget tactile feedback. On the native iOS build this drives the
 * Taptic engine; on web/Android it falls back to the Vibration API (a silent
 * no-op where that's unsupported, e.g. iOS Safari). Always guarded so a missing
 * plugin or a rejected permission can never break the interaction that called
 * it — feedback is a nicety, not a dependency.
 */
export function tap(style: ImpactStyle = ImpactStyle.Light): void {
  void Haptics.impact({ style }).catch(() => undefined);
}

export { ImpactStyle };
