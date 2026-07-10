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

  Scenario: Filtering to Songs hides the Albums section
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I filter results to "Songs"
    Then I do not see the Albums section

  Scenario: "All" previews a few songs; the Songs filter shows more
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    And the songs section shows at most 4 results
    When I filter results to "Songs"
    Then the songs section shows more than 4 results

  # Search for the seeded, cadence-test-OWNED playlist ("Cadence Test Mix",
  # guaranteed by scripts/seed-e2e-user.sh) rather than an ambient public
  # playlist — the community library's public playlists come and go (a cleanup
  # that flips them private, or their owner deleting them, would silently break
  # this), so the fixture we assert on must be one the test user owns.
  Scenario: Searching finds playlists and opens one
    Given I am signed in
    When I open the Search tab
    And I search for "Cadence"
    When I filter results to "Playlists"
    Then I see playlist results
    When I open the first playlist result
    Then I see the playlist tracks

  Scenario: A nonsense query shows the empty state
    Given I am signed in
    When I open the Search tab
    And I search for "zzzxqqwvnotarealthing"
    Then I see the no-results state

  Scenario: A played result shows up in recent searches
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I tap the first song result
    And I clear the search box
    Then I see it in recent searches

  Scenario: Browsing a genre from the search screen plays its tracks
    Given I am signed in
    When I open the Search tab
    And I open the "Pop" genre tile
    Then I see the genre's tracks
    When I play the genre
    Then the Now-Playing bar shows a track
