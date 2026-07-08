Feature: Playlists
  Playlists from Jellyfin show in Your Library, open to their tracks, and play
  as a queue.

  Scenario: Opening a playlist shows its tracks and plays them
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    Then I see the playlist tracks
    When I play the playlist
    Then the Now-Playing bar shows a track
