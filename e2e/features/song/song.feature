Feature: Song detail
  Every track has its own page — art, title, and links out to its artist and
  album — reachable from the full player. Real tracks come from Jellyfin.

  Scenario: Opening the song page from the full player
    Given I am signed in
    When I tap a track from search
    And I open the full player
    And I open the song page from the full player
    Then I see the song's detail page with a link to its artist
