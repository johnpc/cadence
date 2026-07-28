import Foundation

/// The "Continue listening" data the app hands the widget via the shared App
/// Group. Mirrors the web-side `WidgetSnapshot` (src/features/widget/widgetTypes.ts)
/// — keep the two in sync. All fields are plain + optional-tolerant so a shape
/// change can't crash the widget.
struct ContinueListeningSnapshot: Codable {
    let id: String
    let title: String
    let subtitle: String
    let kind: String          // "audiobook" | "album" | "playlist" | "artist"
    let artUrl: String?
    let progress: Double?     // 0...1 for a resumable audiobook, else nil
    let deepLink: String

    /// App Group + key shared with the app (MainViewController writes here).
    static let appGroup = "group.com.johncorser.cadence"
    static let key = "continueListeningSnapshot"

    /// Read + decode the current snapshot from the shared defaults, or nil when
    /// absent/unreadable (widget then shows its empty state).
    static func load() -> ContinueListeningSnapshot? {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: key),
            json != "null",
            let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(ContinueListeningSnapshot.self, from: data)
    }
}
