Feature: Artist detail
  Searching surfaces artists (via Jellyfin's Artists endpoint), and tapping one
  opens their page with their albums.

  Scenario: Opening an artist from search shows their albums
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums

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
