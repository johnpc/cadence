import Foundation
import WatchConnectivity

/// The watch side of the remote: receives now-playing state from the phone
/// (applicationContext) and sends transport commands back (sendMessage). The
/// phone's web player does the actual playback — this is a remote + display.
final class WatchConnector: NSObject, ObservableObject, WCSessionDelegate {
    @Published var nowPlaying = NowPlaying()

    override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        let s = WCSession.default
        s.delegate = self
        s.activate()
    }

    /// Send a transport command to the phone ("toggle" | "next" | "prev" |
    /// "seekForward" | "seekBack"). Uses sendMessage when reachable, else queues
    /// via transferUserInfo so a tap isn't silently dropped when the phone is
    /// momentarily unreachable.
    func send(_ command: String) {
        let s = WCSession.default
        if s.isReachable {
            s.sendMessage(["command": command], replyHandler: nil, errorHandler: nil)
        } else {
            s.transferUserInfo(["command": command])
        }
    }

    private func ingest(_ ctx: [String: Any]) {
        guard let json = ctx["state"] as? String, let np = NowPlaying.from(json: json) else { return }
        DispatchQueue.main.async { self.nowPlaying = np }
    }

    func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {
        // Pick up whatever state the phone last set, on launch.
        ingest(s.receivedApplicationContext)
    }
    func session(_ s: WCSession, didReceiveApplicationContext ctx: [String: Any]) { ingest(ctx) }
}
