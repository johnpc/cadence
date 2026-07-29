Feature: Offline library
  An iPod-style browser of downloaded content that needs no backend. Turning on
  Offline mode in Settings makes the app show only what's saved on the device,
  grouped into playlists, artists, albums, audiobooks, and songs — all playable
  with no connection.

  Scenario: Force offline mode and browse downloaded content
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I download the first song result
    Then the first song result shows as downloaded
    When I turn on Offline mode in Settings
    And I open the offline library
    Then the offline library shows my downloaded content
    When I open the Songs section of the offline library
    Then I see a downloaded song there
