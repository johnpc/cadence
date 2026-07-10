Feature: Playback
  Tapping a track starts playback: the Now-Playing bar appears with the track,
  and the full player opens. Real tracks come from the Jellyfin library.

  Scenario: Playing a track shows it in the Now-Playing bar
    Given I am signed in
    When I tap a track from search
    Then the Now-Playing bar shows a track
    And the audio element is loaded with a Jellyfin stream

  Scenario: Changing the playback speed applies to the audio
    Given I am signed in
    When I tap a track from search
    And I set the playback speed to "1.5" in settings
    Then the audio plays at 1.5x speed

  Scenario: An armed sleep timer shows in the player and can be cancelled there
    Given I am signed in
    When I tap a track from search
    And I arm a 30 minute sleep timer in settings
    And I open the full player
    Then I see the sleep timer indicator
    When I cancel the sleep timer from the player
    Then the sleep timer indicator is gone

  Scenario: Opening the full player and advancing to the next track
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I tap next
    Then the Now-Playing bar shows a track

  Scenario: The now-playing track survives a reload
    Given I am signed in
    When I tap a track from search
    And I reload the app
    Then the Now-Playing bar shows a track

  Scenario: The full player shows the next track in the queue
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    Then I see the playlist tracks
    When I play the playlist
    And I open the full player
    Then the full player shows the next-up track

  Scenario: The spacebar toggles playback
    Given I am signed in
    When I tap a track from search
    And I press the spacebar
    Then playback is paused

  Scenario: The S key toggles shuffle
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I press the "s" key
    Then shuffle is on

  Scenario: The repeat button cycles off then all then one
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I tap the repeat button
    Then repeat is set to "all"
    When I tap the repeat button
    Then repeat is set to "one"
    When I tap the repeat button
    Then repeat is set to "off"

  Scenario: Viewing lyrics for the playing track
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I open lyrics
    Then the lyrics sheet is shown

  Scenario: Saving the current queue as a playlist
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I open the queue
    Then I can save the queue as a playlist

  Scenario: The full player links the artist to their page
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I tap the artist in the full player
    Then I see the artist page
