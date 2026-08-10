Feature: Native iOS Now Playing bridge
  On the native iOS app the lock screen / Control Center / Bluetooth are driven by
  a NATIVE MPRemoteCommandCenter, not the WKWebView's W3C MediaSession. The web
  player mirrors its state to native via a webkit message handler, and native
  relays remote transport commands back as `cadence:nowplaying:*` DOM events.

  These scenarios stand in a FAKE native bridge (an injected
  `webkit.messageHandlers.cadenceNowPlaying`) so the exact production code path —
  state push + command handling + the MediaSession stand-down — runs in CI, no
  simulator needed. The commands fired are the same DOM events the real Swift relay
  dispatches, so a green run proves the JS half of the native contract end to end.

  NOTE: kept to TWO scenarios that each play at most one playlist — playback over
  the shared CI Jellyfin tunnel is the slow part, so we assert everything the
  bridge does (state push, queue info, next/prev/seek) within a single play rather
  than replaying per behavior (which overran the area's timeout).

  Background:
    Given I am signed in
    And the native now-playing bridge is present

  Scenario: The bridge mirrors state and honours every transport command
    When I play a playlist
    Then native receives now-playing state for the current track
    And the pushed state includes the queue index and count
    When native sends the "next" transport command
    Then the next-up track becomes current
    When native sends the "prev" transport command
    Then the first track is current again
    When native sends a seek command to 42 seconds
    Then the audio position is about 42 seconds

  Scenario: The web MediaSession stands down so native is the sole OS owner
    When I play a playlist
    Then the web MediaSession publishes no metadata
