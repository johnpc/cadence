Feature: Native iOS Now Playing bridge
  On the native iOS app the lock screen / Control Center / Bluetooth are driven by
  a NATIVE MPRemoteCommandCenter, not the WKWebView's W3C MediaSession. The web
  player mirrors its state to native via a webkit message handler, and native
  relays remote transport commands back as `cadence:nowplaying:*` DOM events.

  These scenarios stand in a FAKE native bridge (an injected
  `webkit.messageHandlers.cadenceNowPlaying`) so the exact production code path —
  state push + command handling + the MediaSession stand-down — runs in CI, no
  simulator needed. The commands are the same DOM events the real Swift relay
  fires, so a green run proves the JS half of the native contract end to end.

  Background:
    Given I am signed in
    And the native now-playing bridge is present

  Scenario: The web player mirrors now-playing state to native with queue info
    When I play a playlist
    Then native receives now-playing state for the current track
    And the pushed state includes the queue index and count

  Scenario: A native "next" command advances the queue
    When I play a playlist
    And native sends the "next" transport command
    Then the next-up track becomes current

  Scenario: A native "previous" command after progress restarts / goes back
    When I play a playlist
    And native sends the "next" transport command
    And native sends the "prev" transport command
    Then the first track is current again

  Scenario: A native absolute-seek command moves playback position
    When I play a playlist
    And native sends a seek command to 42 seconds
    Then the audio position is about 42 seconds

  Scenario: The web MediaSession stands down so native is the sole OS owner
    When I play a playlist
    Then the web MediaSession publishes no metadata
