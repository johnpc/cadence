import AVFoundation
import XCTest

final class AudioRouteLossTests: XCTestCase {
    func testPausesWhenHeadphonesOrBluetoothGoAway() {
        for port: AVAudioSession.Port in [.headphones, .bluetoothA2DP, .bluetoothLE, .carAudio, .airPlay] {
            XCTAssertTrue(
                AudioRouteLoss.shouldPause(reason: .oldDeviceUnavailable, previousOutputs: [port]),
                "should pause when \(port.rawValue) disconnects"
            )
        }
    }

    func testKeepsPlayingWhenTheSpeakerWasTheRoute() {
        XCTAssertFalse(AudioRouteLoss.shouldPause(reason: .oldDeviceUnavailable, previousOutputs: [.builtInSpeaker]))
    }

    func testIgnoresOtherRouteChanges() {
        // Plugging headphones IN, a category change, or an override never pauses.
        for reason: AVAudioSession.RouteChangeReason in [.newDeviceAvailable, .categoryChange, .override, .wakeFromSleep] {
            XCTAssertFalse(AudioRouteLoss.shouldPause(reason: reason, previousOutputs: [.headphones]))
        }
    }
}
