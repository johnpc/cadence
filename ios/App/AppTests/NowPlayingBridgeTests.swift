import XCTest
import MediaPlayer
// Host-less unit test: NowPlayingBridge.swift is compiled directly into this
// bundle (see add_test_target.rb), so no `@testable import App` — and thus no
// Capacitor/Pods dependency — is needed. NowPlayingBridge + NowPlayingSnapshot
// are visible as same-module types.

/// Unit tests for the native Now Playing bridge — the piece that keeps Cadence a
/// durable OS Now Playing app and relays lock-screen transport commands. These run
/// on a macOS/simulator test host in CI (see .github/workflows), so they exercise
/// the REAL MPNowPlayingInfoCenter / MPRemoteCommandCenter singletons the app uses.
final class NowPlayingBridgeTests: XCTestCase {
    private var bridge: NowPlayingBridge!

    override func setUp() {
        super.setUp()
        bridge = NowPlayingBridge()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    override func tearDown() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        bridge = nil
        super.tearDown()
    }

    private func snapshot(
        hasTrack: Bool = true,
        isPlaying: Bool = true,
        position: Double = 12,
        duration: Double = 200,
        queueIndex: Int = 2,
        queueCount: Int = 7
    ) -> NowPlayingSnapshot {
        NowPlayingSnapshot(
            title: "Song", artist: "The Band", album: "Album", artUrl: nil,
            isPlaying: isPlaying, position: position, duration: duration,
            hasTrack: hasTrack, queueIndex: queueIndex, queueCount: queueCount
        )
    }

    func testUpdatePopulatesNowPlayingInfo() {
        bridge.update(snapshot())
        let info = MPNowPlayingInfoCenter.default().nowPlayingInfo
        XCTAssertEqual(info?[MPMediaItemPropertyTitle] as? String, "Song")
        XCTAssertEqual(info?[MPMediaItemPropertyArtist] as? String, "The Band")
        XCTAssertEqual(info?[MPMediaItemPropertyPlaybackDuration] as? Double, 200)
        XCTAssertEqual(info?[MPNowPlayingInfoPropertyElapsedPlaybackTime] as? Double, 12)
    }

    func testUpdatePublishesQueueIndexAndCount() {
        // The regression fix: without queue count/index iOS/CarPlay grays out the
        // prev/next-track buttons. Assert both are mirrored onto the info center.
        bridge.update(snapshot(queueIndex: 2, queueCount: 7))
        let info = MPNowPlayingInfoCenter.default().nowPlayingInfo
        XCTAssertEqual(info?[MPNowPlayingInfoPropertyPlaybackQueueCount] as? Int, 7)
        XCTAssertEqual(info?[MPNowPlayingInfoPropertyPlaybackQueueIndex] as? Int, 2)
    }

    func testPlaybackRateReflectsIsPlaying() {
        bridge.update(snapshot(isPlaying: true))
        XCTAssertEqual(
            MPNowPlayingInfoCenter.default().nowPlayingInfo?[MPNowPlayingInfoPropertyPlaybackRate] as? Double,
            1.0
        )
        bridge.update(snapshot(isPlaying: false))
        XCTAssertEqual(
            MPNowPlayingInfoCenter.default().nowPlayingInfo?[MPNowPlayingInfoPropertyPlaybackRate] as? Double,
            0.0
        )
    }

    func testUpdateClearsNowPlayingWhenNoTrack() {
        bridge.update(snapshot())
        XCTAssertNotNil(MPNowPlayingInfoCenter.default().nowPlayingInfo)
        bridge.update(snapshot(hasTrack: false))
        XCTAssertNil(MPNowPlayingInfoCenter.default().nowPlayingInfo)
    }

    func testActivateEnablesTrackSkipAndDisablesIntervalSkip() {
        bridge.activate()
        let center = MPRemoteCommandCenter.shared()
        // Track skip must be enabled (the prev/next lock-screen buttons)...
        XCTAssertTrue(center.nextTrackCommand.isEnabled)
        XCTAssertTrue(center.previousTrackCommand.isEnabled)
        // ...and the ±15s podcast skip disabled, so iOS shows track skip instead.
        XCTAssertFalse(center.skipForwardCommand.isEnabled)
        XCTAssertFalse(center.skipBackwardCommand.isEnabled)
    }

    func testSnapshotDecodesFromWebPayload() throws {
        // The exact JSON shape the web layer posts (see nowPlayingTypes.ts).
        let json = """
        {"title":"S","artist":"A","album":"Al","artUrl":null,"isPlaying":true,
         "position":5,"duration":100,"hasTrack":true,"queueIndex":1,"queueCount":4}
        """
        let snap = try JSONDecoder().decode(NowPlayingSnapshot.self, from: Data(json.utf8))
        XCTAssertEqual(snap.title, "S")
        XCTAssertEqual(snap.queueIndex, 1)
        XCTAssertEqual(snap.queueCount, 4)
        XCTAssertTrue(snap.hasTrack)
    }
}
