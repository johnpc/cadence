import SwiftUI

/// The watch remote UI: now-playing title/artist + a progress ring + transport
/// controls (prev · play/pause · next) and ±15s seek. Each control sends a
/// command to the phone; the phone's web player performs it and pushes updated
/// state back, which re-renders this view.
struct NowPlayingView: View {
    @ObservedObject var connector: WatchConnector

    var body: some View {
        let np = connector.nowPlaying
        VStack(spacing: 6) {
            if np.hasTrack {
                Text(np.title).font(.headline).lineLimit(2).multilineTextAlignment(.center)
                Text(np.artist).font(.caption2).foregroundColor(.secondary).lineLimit(1)
                ProgressView(value: np.progress).tint(.green)
                controls(isPlaying: np.isPlaying)
                seekRow
            } else {
                Spacer()
                Image(systemName: "music.note").font(.title2).foregroundColor(.green)
                Text("Nothing playing").font(.caption).foregroundColor(.secondary)
                Text("Play something on your phone").font(.caption2).foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                Spacer()
            }
        }
        .padding(.horizontal, 4)
    }

    private func controls(isPlaying: Bool) -> some View {
        HStack(spacing: 18) {
            btn("backward.fill") { connector.send("prev") }
            btn(isPlaying ? "pause.fill" : "play.fill") { connector.send("toggle") }
            btn("forward.fill") { connector.send("next") }
        }
    }

    private var seekRow: some View {
        HStack(spacing: 24) {
            btn("gobackward.15", small: true) { connector.send("seekBack") }
            btn("goforward.15", small: true) { connector.send("seekForward") }
        }
    }

    private func btn(_ system: String, small: Bool = false, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: system).font(.system(size: small ? 16 : 22))
        }
        .buttonStyle(.plain).foregroundColor(small ? .secondary : .primary)
    }
}
