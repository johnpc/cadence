import Foundation

/// Now-playing state the watch receives from the phone. Mirrors the web-side
/// WatchState (src/features/watch/watchTypes.ts) — keep the two in sync. All
/// fields optional-tolerant so a shape change can't crash the watch app.
struct NowPlaying: Codable, Equatable {
    var title: String = ""
    var artist: String = ""
    var artUrl: String? = nil
    var isPlaying: Bool = false
    var position: Double = 0
    var duration: Double = 0
    var hasTrack: Bool = false

    /// Progress 0...1 for the watch's ring, guarding a zero/short duration.
    var progress: Double {
        duration > 0 ? min(1, max(0, position / duration)) : 0
    }

    /// Decode from the JSON string the phone sends via applicationContext.
    static func from(json: String) -> NowPlaying? {
        guard let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(NowPlaying.self, from: data)
    }
}
