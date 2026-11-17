Feature: Listening with no connection
  With no connection to the server, Cadence says so plainly, points at the
  downloads, and plays only what is on the device: a song that isn't downloaded
  is skipped straight to the next download, and a like made offline is saved
  once the connection comes back.

  Background:
    Given I am signed in
    And I have downloaded the 1st and 3rd songs of the album "Saltwater"

  Scenario: Opening the app with no connection shows the offline state and plays downloads
    When the server becomes unreachable
    And I reopen the app
    Then I see that I'm offline
    And Home says it's offline instead of "Something went wrong"
    When I browse my downloads from the offline message
    And I play my first downloaded song
    Then the audio element is playing from a local download

  Scenario: A partly downloaded album plays only its downloads offline
    When I play the album "Saltwater" from the start
    And the server becomes unreachable
    And I skip to the next song
    Then I'm told "Not downloaded — skipping to the next download."
    And "Salt and Cedar" plays from a local download
    When I skip to the next song
    Then I'm told "You’re offline — nothing else in this queue is downloaded."
    And playback stops
    When I press play
    Then I'm told "You’re offline — nothing else in this queue is downloaded."

  Scenario: Searching with no connection says so
    When the server becomes unreachable
    And I open the Search tab
    And I type "love" into search
    Then the search says it's offline

  @offline-like
  Scenario: A like made offline is saved when the connection comes back
    When I play the album "Saltwater" from the start
    And the phone loses its connection
    And I like the playing song from the full player
    And the phone's connection comes back
    Then the server has "Undertow" in Liked Songs
