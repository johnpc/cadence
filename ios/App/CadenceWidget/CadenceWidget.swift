import WidgetKit
import SwiftUI

/// Timeline entry — one snapshot at a point in time. The app pushes fresh data
/// (via the App Group) and calls WidgetCenter.reloadTimelines, so a static
/// single-entry timeline is enough; we also refresh on a slow cadence as a
/// backstop in case a reload is missed.
struct ContinueEntry: TimelineEntry {
    let date: Date
    let snapshot: ContinueListeningSnapshot?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> ContinueEntry {
        ContinueEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (ContinueEntry) -> Void) {
        completion(ContinueEntry(date: Date(), snapshot: ContinueListeningSnapshot.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ContinueEntry>) -> Void) {
        let entry = ContinueEntry(date: Date(), snapshot: ContinueListeningSnapshot.load())
        // Backstop refresh in ~30 min; the app also reloads on every change.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

/// The widget UI. Tapping it opens the app to the item via the snapshot's deep
/// link (widgetURL). Shows a placeholder prompt when nothing is in progress.
struct CadenceWidgetEntryView: View {
    var entry: ContinueEntry

    var body: some View {
        if let snap = entry.snapshot {
            content(snap)
                .widgetURL(URL(string: snap.deepLink))
        } else {
            emptyState
        }
    }

    private func content(_ snap: ContinueListeningSnapshot) -> some View {
        HStack(spacing: 12) {
            artwork(snap)
            VStack(alignment: .leading, spacing: 3) {
                Text(kicker(snap)).font(.caption2).fontWeight(.bold)
                    .foregroundColor(.green).textCase(.uppercase)
                Text(snap.title).font(.headline).lineLimit(2)
                Text(snap.subtitle).font(.caption).foregroundColor(.secondary).lineLimit(1)
                if let p = snap.progress {
                    ProgressView(value: p).tint(.green).padding(.top, 2)
                }
            }
            Spacer(minLength: 0)
        }
        .padding()
    }

    private func artwork(_ snap: ContinueListeningSnapshot) -> some View {
        // Widgets can't load remote images synchronously here without AppIntents/
        // network entitlements; show a themed placeholder glyph keyed to kind so
        // the widget is instant + offline-safe. (Art can be added later via a
        // shared cached file written by the app.)
        ZStack {
            RoundedRectangle(cornerRadius: snap.kind == "artist" ? 30 : 8)
                .fill(Color.green.opacity(0.18))
            Image(systemName: glyph(snap.kind))
                .font(.title2).foregroundColor(.green)
        }
        .frame(width: 56, height: 56)
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "play.circle.fill").font(.title).foregroundColor(.green)
            Text("Nothing playing yet").font(.caption).foregroundColor(.secondary)
        }
        .padding()
    }

    private func kicker(_ snap: ContinueListeningSnapshot) -> String {
        snap.kind == "audiobook" ? "Continue listening" : "Jump back in"
    }

    private func glyph(_ kind: String) -> String {
        switch kind {
        case "audiobook": return "book.fill"
        case "artist": return "music.mic"
        case "playlist": return "music.note.list"
        default: return "opticaldisc.fill"
        }
    }
}

@main
struct CadenceWidget: Widget {
    let kind = "CadenceContinueListening"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            CadenceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Continue Listening")
        .description("Pick up your current audiobook, album, or playlist.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
