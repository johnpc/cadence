Feature: Playback
  Tapping a track starts playback: the Now-Playing bar appears with the track,
  and the full player opens. Real tracks come from the Jellyfin library.

  Scenario: Playing a track shows it in the Now-Playing bar
    Given I am signed in
    When I tap a track from search
    Then the Now-Playing bar shows a track
    And the audio element is loaded with a Jellyfin stream

  Scenario: Opening the full player and advancing to the next track
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I tap next
    Then the Now-Playing bar shows a track

  Scenario: The spacebar toggles playback
    Given I am signed in
    When I tap a track from search
    And I press the spacebar
    Then playback is paused
