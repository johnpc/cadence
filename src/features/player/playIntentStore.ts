/**
 * The user's INTENT to be playing — deliberately separate from the audio
 * element's actual `paused`/`isPlaying` state.
 *
 * Why they must differ: an OS audio interruption (a phone call, Siri) stops the
 * WKWebView's audio at the session level. iOS may or may not fire a `pause`
 * event, so `isPlaying` can flip to false (or desync entirely) even though the
 * user never chose to stop. If we used `isPlaying` to decide whether to
 * auto-resume when the call ends, that interruption-induced flip would cancel the
 * resume — the exact bug where music never comes back after a call.
 *
 * So intent is set from USER/PLAYBACK actions only: true when audio actually
 * starts (the element's `play` event), false on a deliberate pause or stop. It is
 * never touched by interruption/background-induced pauses, so it survives them
 * and tells the resume path "the user still wants sound".
 *
 * Module-scoped and listener-free (mirrors sessionStore): it's read synchronously
 * at the moment an interruption ends, not rendered.
 */
let intent = false;

/** Record whether the user currently intends playback. */
export function setPlayIntent(value: boolean): void {
  intent = value;
}

/** Does the user still intend to be playing? Read when deciding to auto-resume. */
export function getPlayIntent(): boolean {
  return intent;
}
