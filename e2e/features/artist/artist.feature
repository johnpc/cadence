Feature: Artist detail
  Searching surfaces artists (via Jellyfin's Artists endpoint), and tapping one
  opens their page with their albums.

  Scenario: Opening an artist from search shows their albums
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums

  Scenario: "See all" opens the artist's full track list and plays it
    Given I am signed in
    When I open an artist that has popular tracks
    And I tap See all on the popular tracks
    Then I see the artist's full track list
    When I play the artist track list
    Then the Now-Playing bar shows a track

  Scenario: An artist page groups the discography into labelled sections
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums
    And the discography shows a labelled section

  Scenario: An artist page suggests related artists
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums
    And I see related artists to explore

  Scenario: Following an artist adds them to Your Library
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums
    When I follow the artist
    And I open the Library tab
    And I filter the library to "artists"
    Then the followed artists list is not empty
