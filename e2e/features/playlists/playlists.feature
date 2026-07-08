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

  Scenario: A playlist recommends songs to add and lets me dismiss them
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    Then I see the playlist tracks
    And I see recommended songs to add
    When I dismiss the first recommendation
    Then a different recommendation takes its place

  Scenario: Finding a song within a playlist narrows the list
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    Then I see the playlist tracks
    And I can find within the playlist
