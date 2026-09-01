import Foundation

/// The JS that pins the WKWebView's W3C MediaSession to a MUSIC-PLAYER command
/// shape: next/prev-track bound, ±seek unset.
///
/// Why native owns this: WebKit's GPU process registers its own Now Playing
/// client with MediaRemote, and iOS ELECTS that client over the app's
/// MPNowPlayingInfoCenter registration whenever web audio is playing
/// (mediaremoted: "selectionReason=is playing"). The lock screen therefore
/// shows whatever COMMAND SET WebKit registers — which, left alone, is the
/// default element controls (play/pause/±15s skip, no track skip). The only
/// lever over WebKit's registration is the page's MediaSession handler shape,
/// so the app injects and periodically re-asserts it here, immune to web-bundle
/// branching (a wrong platform check in JS can never bring the ±skip circles
/// back).
///
/// The handlers dispatch the SAME `cadence:nowplaying:*` DOM events the native
/// MPRemoteCommandCenter relay uses (useNowPlayingCommands handles + logs them
/// with `via: native`), so both command paths converge on one web-player entry
/// point. Re-binding is idempotent; the 5s interval heals any later rebinding
/// by web code or a WebKit-internal reset.
enum NowPlayingShape {
    static let script = """
    (function () {
      if (window.__cadenceNowPlayingShape) { return; }
      window.__cadenceNowPlayingShape = true;
      var assert = function () {
        try {
          var ms = navigator.mediaSession;
          if (!ms || !ms.setActionHandler) { return; }
          ms.setActionHandler('nexttrack', function () {
            window.dispatchEvent(new Event('cadence:nowplaying:next'));
          });
          ms.setActionHandler('previoustrack', function () {
            window.dispatchEvent(new Event('cadence:nowplaying:prev'));
          });
          // A music player: never offer the ±seek buttons — iOS prefers them
          // over next/prev on the lock screen when both are registered.
          ms.setActionHandler('seekbackward', null);
          ms.setActionHandler('seekforward', null);
        } catch (e) { /* MediaSession unavailable — nothing to shape */ }
      };
      assert();
      setInterval(assert, 5000);
    })();
    """
}
