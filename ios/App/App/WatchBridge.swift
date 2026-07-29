import Foundation
#if canImport(WatchConnectivity)
import WatchConnectivity
#endif

/// Bridges the phone's web player to the paired Apple Watch remote over
/// WatchConnectivity. The phone is the source of truth: it pushes now-playing
/// STATE to the watch (updateApplicationContext — always the latest, coalesced),
/// and receives transport COMMANDS from the watch, which it hands to `onCommand`
/// (MainViewController turns each into a `cadence:watch:*` DOM event on the web
/// player — the same evaluateJavaScript pattern used for audio-interruption).
///
/// All no-ops when WatchConnectivity is unsupported (e.g. iPad) or unpaired.
final class WatchBridge: NSObject {
    /// Called on the main thread with a command string from the watch
    /// ("toggle" | "next" | "prev" | "seekForward" | "seekBack").
    var onCommand: ((String) -> Void)?

    #if canImport(WatchConnectivity)
    private var session: WCSession? {
        WCSession.isSupported() ? WCSession.default : nil
    }

    func activate() {
        guard let session = session else { return }
        session.delegate = self
        session.activate()
    }

    /// Push the latest now-playing JSON to the watch. applicationContext keeps
    /// only the most recent value, so a fast-ticking scrubber can't queue-flood.
    func sendState(_ json: String) {
        guard let session = session, session.activationState == .activated else { return }
        try? session.updateApplicationContext(["state": json])
    }
    #else
    func activate() {}
    func sendState(_ json: String) {}
    #endif
}

#if canImport(WatchConnectivity)
extension WatchBridge: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    // Re-activate when switching to a new paired watch.
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    /// A command from the watch. Watch sends `["command": "next"]` etc.
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let cmd = message["command"] as? String else { return }
        DispatchQueue.main.async { [weak self] in self?.onCommand?(cmd) }
    }
}
#endif
