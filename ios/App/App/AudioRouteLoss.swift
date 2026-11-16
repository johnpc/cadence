import AVFoundation

/// When an audio route change should pause playback: the PRIVATE output the user
/// was listening on went away — headphones unplugged, Bluetooth / AirPods
/// disconnected, CarPlay or AirPlay ended. Apple's media apps pause then; without
/// it Cadence kept playing out of the phone speaker. Pure so it is unit-tested
/// without an audio session (AppTests compiles this file directly).
enum AudioRouteLoss {
    /// Outputs that are personal or attached: losing one means "stop, don't blare".
    static let privateOutputs: Set<AVAudioSession.Port> = [
        .headphones, .bluetoothA2DP, .bluetoothLE, .bluetoothHFP,
        .airPlay, .carAudio, .usbAudio, .lineOut, .HDMI,
    ]

    static func shouldPause(
        reason: AVAudioSession.RouteChangeReason,
        previousOutputs: [AVAudioSession.Port]
    ) -> Bool {
        reason == .oldDeviceUnavailable && previousOutputs.contains { privateOutputs.contains($0) }
    }
}
