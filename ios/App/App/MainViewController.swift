import UIKit
import Capacitor
import WebKit
import AVFoundation
#if canImport(WidgetKit)
import WidgetKit
#endif

/// Capacitor bridge VC that listens for one-way messages from the web layer:
///  - "cadenceAudioSession": posted when playback starts, so we keep the
///    AVAudioSession alive for background audio (see src/lib/nativeAudioSession.ts).
///  - "cadenceWidget": the "Continue listening" snapshot JSON, which we persist to
///    the shared App Group so the WidgetKit extension can render it (the widget
///    process can't run any web code). See src/features/widget/.
///  - "cadenceWatch": now-playing JSON relayed to the paired Apple Watch remote;
///    the watch's transport commands come back and become cadence:watch:* DOM
///    events on the web player. See src/features/watch/ + WatchBridge.swift.
class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {

    /// Relays now-playing state to / commands from the paired Apple Watch.
    private let watch = WatchBridge()

    /// App Group shared with the widget extension — the ONLY channel between the
    /// app and the widget. Must match the extension's entitlement + the id used
    /// in CadenceWidget.swift.
    static let appGroup = "group.com.johncorser.cadence"
    /// Key under which the snapshot JSON string is stored in the shared defaults.
    static let widgetSnapshotKey = "continueListeningSnapshot"

    override func viewDidLoad() {
        super.viewDidLoad()
        // Register the one-way handlers on the live web view's content controller.
        // (Done here rather than by overriding the configuration factory so it
        // doesn't depend on a specific Capacitor override point.)
        let controller = webView?.configuration.userContentController
        controller?.add(self, name: "cadenceAudioSession")
        controller?.add(self, name: "cadenceWidget")
        controller?.add(self, name: "cadenceWatch")
        // A watch command → the matching DOM event on the web player.
        watch.onCommand = { [weak self] cmd in self?.dispatchWatchCommand(cmd) }
        watch.activate()
    }

    /// Map a watch transport command to the `cadence:watch:*` event the web
    /// player listens for (see src/features/watch/watchTypes.ts).
    private func dispatchWatchCommand(_ command: String) {
        let events: [String: String] = [
            "toggle": "cadence:watch:toggle",
            "next": "cadence:watch:next",
            "prev": "cadence:watch:prev",
            "seekForward": "cadence:watch:seekforward",
            "seekBack": "cadence:watch:seekback",
        ]
        guard let evt = events[command] else { return }
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('\(evt)'))", completionHandler: nil)
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        switch message.name {
        case "cadenceAudioSession":
            reassertAudioSession()
            webView?.evaluateJavaScript(
                "window.__cadenceNativeLog && window.__cadenceNativeLog('native-session','reasserted')",
                completionHandler: nil
            )
        case "cadenceWidget":
            storeWidgetSnapshot(message.body as? String)
        case "cadenceWatch":
            if let json = message.body as? String { watch.sendState(json) }
        default:
            break
        }
    }

    /// Persist the "Continue listening" snapshot to the shared App Group and ask
    /// WidgetKit to refresh. The web app posts a JSON string (or the literal
    /// "null" to clear); we store it verbatim and the extension decodes it.
    private func storeWidgetSnapshot(_ json: String?) {
        guard let defaults = UserDefaults(suiteName: MainViewController.appGroup) else { return }
        if let json = json, json != "null" {
            defaults.set(json, forKey: MainViewController.widgetSnapshotKey)
        } else {
            defaults.removeObject(forKey: MainViewController.widgetSnapshotKey)
        }
        #if canImport(WidgetKit)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "CadenceContinueListening")
        }
        #endif
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
