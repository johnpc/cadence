import SwiftUI

/// The Cadence Apple Watch remote app entry point.
@main
struct CadenceWatchApp: App {
    @StateObject private var connector = WatchConnector()

    var body: some Scene {
        WindowGroup {
            NowPlayingView(connector: connector)
        }
    }
}
