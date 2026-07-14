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
    }

    private func reassertAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)
        } catch {
            print("cadenceAudioSession: failed to re-assert audio session: \(error)")
        }
    }
}
