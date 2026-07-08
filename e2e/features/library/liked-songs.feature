Feature: Liked songs
  The user's liked songs (Jellyfin favorites) show in Your Library, and liking
  a song on Home adds it there.

  Scenario: Your Library shows liked songs
    Given I am signed in
    When I open the Library tab
    Then I see the liked songs list

  Scenario: Liking a song on Home adds it to the library
    Given I am signed in
    When I like a track from search
    And I open the Library tab
    Then the liked songs list is not empty

  Scenario: Shuffle-playing liked songs
    Given I am signed in
    When I open the Library tab
    And I shuffle-play the liked songs
    Then the Now-Playing bar shows a track
