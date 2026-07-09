Feature: Liked songs
  The user's liked songs (Jellyfin favorites) live in Your Library as the first
  playlist row, and liking a song adds it there.

  Scenario: Your Library shows the Liked Songs row
    Given I am signed in
    When I open the Library tab
    Then I see the Liked Songs row

  Scenario: Liking a song adds it to Liked Songs
    Given I am signed in
    When I like a track from search
    And I open the Library tab
    And I open Liked Songs
    Then the liked songs list is not empty

  Scenario: Shuffle-playing liked songs
    Given I am signed in
    When I open the Library tab
    And I open Liked Songs
    And I shuffle-play the liked songs
    Then the Now-Playing bar shows a track

  Scenario: Sorting and finding within liked songs
    Given I am signed in
    When I open the Library tab
    And I open Liked Songs
    Then the liked songs list is not empty
    And I can sort and find within liked songs
