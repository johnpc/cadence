import Foundation
import UIKit
import MediaPlayer

/// Registers Cadence as a DURABLE OS "Now Playing" app via MPNowPlayingInfoCenter
/// + MPRemoteCommandCenter, and relays the remote transport commands back to the
/// web player.
///
/// Why native (not just the WKWebView's W3C MediaSession): WebKit only holds the
/// Now Playing slot WHILE its <audio> is actively playing — pause, background, or
/// a Bluetooth route drop tears it down. So on a Bluetooth RECONNECT iOS resumes
/// whichever app kept a durable registration (Apple Podcasts/Music register
/// natively), not Cadence. Registering here keeps Cadence the Now Playing app
/// across pause/background/route changes, so a reconnect resumes THIS app's queue.
///
/// The web player stays the source of truth: it pushes STATE (title/art/position/
/// isPlaying) via `update(...)`, and native hands remote COMMANDS to `onCommand`
/// (MainViewController turns each into a `cadence:nowplaying:*` DOM event — the
/// same evaluateJavaScript relay used for the watch + audio interruptions).
final class NowPlayingBridge: NSObject {
    /// Command strings handed to the web layer: "play" | "pause" | "next" | "prev".
    var onCommand: ((String) -> Void)?
    /// Absolute-seek target in seconds from the lock-screen scrubber.
    var onSeek: ((Double) -> Void)?

    private var artworkURL: String?
    private var artworkCache: MPMediaItemArtwork?
    /// Serialises artwork fetches so a fast metadata change can't race two loads
    /// onto the info center out of order.
    private let artworkQueue = DispatchQueue(label: "com.johncorser.cadence.nowplaying.art")

    /// Wire the remote command center once. Each handler forwards to the web
    /// player and returns `.success` so iOS keeps sending us commands.
    func activate() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in self?.forward("play") ?? .commandFailed }
        center.pauseCommand.addTarget { [weak self] _ in self?.forward("pause") ?? .commandFailed }
        // A toggle from some accessories → derive from the last known state.
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.forward(self?.isPlaying == true ? "pause" : "play") ?? .commandFailed
        }
        center.nextTrackCommand.addTarget { [weak self] _ in self?.forward("next") ?? .commandFailed }
        center.previousTrackCommand.addTarget { [weak self] _ in self?.forward("prev") ?? .commandFailed }
        // Absolute scrubber seek (lock screen / CarPlay).
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let e = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.onSeek?(e.positionTime)
            return .success
        }
        // We're a music player: expose track skip, not ±15s podcast skip, so the
        // lock screen shows next/prev (iOS prefers skip buttons when registered).
        center.skipForwardCommand.isEnabled = false
        center.skipBackwardCommand.isEnabled = false
    }

    private var isPlaying = false

    private func forward(_ command: String) -> MPRemoteCommandHandlerStatus {
        DispatchQueue.main.async { [weak self] in self?.onCommand?(command) }
        return .success
    }

    /// Update MPNowPlayingInfoCenter from the web player's state. Clears Now
    /// Playing when no track is loaded. Artwork is fetched off the main thread and
    /// only when the URL actually changes (cached otherwise).
    func update(_ state: NowPlayingSnapshot) {
        isPlaying = state.isPlaying
        guard state.hasTrack else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            artworkURL = nil
            artworkCache = nil
            return
        }
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: state.title,
            MPMediaItemPropertyArtist: state.artist,
            MPMediaItemPropertyAlbumTitle: state.album,
            MPMediaItemPropertyPlaybackDuration: state.duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: state.position,
            // Rate drives the lock screen's interpolated scrubber between updates.
            MPNowPlayingInfoPropertyPlaybackRate: state.isPlaying ? 1.0 : 0.0,
        ]
        if let art = currentArtwork(for: state.artUrl) { info[MPMediaItemPropertyArtwork] = art }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    /// Return the cached artwork when the URL is unchanged; otherwise kick off a
    /// background fetch that patches the info center in place when it lands.
    private func currentArtwork(for url: String?) -> MPMediaItemArtwork? {
        guard let url = url, !url.isEmpty else {
            artworkURL = nil
            artworkCache = nil
            return nil
        }
        if url == artworkURL { return artworkCache }
        artworkURL = url
        artworkCache = nil
        fetchArtwork(url)
        return nil
    }

    private func fetchArtwork(_ url: String) {
        guard let u = URL(string: url) else { return }
        artworkQueue.async { [weak self] in
            guard
                let data = try? Data(contentsOf: u),
                let image = UIImage(data: data)
            else { return }
            let art = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            DispatchQueue.main.async {
                guard let self = self, self.artworkURL == url else { return } // stale
                self.artworkCache = art
                // Patch the existing info dict so we don't clobber a newer position.
                var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                info[MPMediaItemPropertyArtwork] = art
                MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            }
        }
    }
}

/// The decoded now-playing state the web player posts (matches NowPlayingState in
/// src/features/nowplaying/nowPlayingTypes.ts).
struct NowPlayingSnapshot: Decodable {
    let title: String
    let artist: String
    let album: String
    let artUrl: String?
    let isPlaying: Bool
    let position: Double
    let duration: Double
    let hasTrack: Bool
}
