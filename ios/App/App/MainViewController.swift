import UIKit
import Capacitor
import WebKit
import AVFoundation

/// Capacitor bridge VC that also listens for a one-way message from the web
/// player ("cadenceAudioSession") posted the moment playback actually starts.
/// Re-activating the AVAudioSession on each real play — not just once at launch,
/// before any audio exists — keeps the WKWebView's <audio> alive when the app is
/// backgrounded or the screen is locked (otherwise iOS suspends it and music
/// stops). See src/lib/nativeAudioSession.ts.
class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Register the one-way handler on the live web view's content controller.
        // (Done here rather than by overriding the configuration factory so it
        // doesn't depend on a specific Capacitor override point.)
        webView?.configuration.userContentController.add(self, name: "cadenceAudioSession")
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "cadenceAudioSession" else { return }
        reassertAudioSession()
        webView?.evaluateJavaScript(
            "window.__cadenceNativeLog && window.__cadenceNativeLog('native-session','reasserted')",
            completionHandler: nil
        )
    }

    private func reassertAudioSession() {
        // Ensure the category is .playback (needed for background audio), but do
        // NOT call setActive(true) here. Device logs proved that setActive(true)
        // on each play, while the WKWebView's <audio> is already playing, itself
        // FIRES an AVAudioSession interruption that immediately pauses playback —
        // every tap played ~90ms then an "interruption began" paused it, looping.
        // The session is activated once at launch (AppDelegate) and the playing
        // <audio> keeps it active; re-activating per play is both unnecessary and
        // the direct cause of the pause loop. Only (re)set the category if it has
        // somehow drifted off .playback (cheap, no interruption when unchanged).
        let session = AVAudioSession.sharedInstance()
        guard session.category != .playback else { return }
        do {
            try session.setCategory(.playback, mode: .default)
        } catch {
            print("cadenceAudioSession: failed to set playback category: \(error)")
        }
    }
}
