Feature: Search
  Search is the primary discovery surface. Typing a query shows real matching
  songs from the Jellyfin library; a nonsense query shows an empty state; and
  tapping a song plays it.

  Scenario: Searching shows real results and plays a song
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I tap the first song result
    Then the Now-Playing bar shows a track

  Scenario: A nonsense query shows the empty state
    Given I am signed in
    When I open the Search tab
    And I search for "zzzxqqwvnotarealthing"
    Then I see the no-results state
