Feature: Album detail
  Tapping an album on Home opens its detail page with the tracklist, and the
  album plays as a queue.

  Scenario: Opening an album from Home shows its tracks and plays them
    Given I am signed in
    When I open the first album on Home
    Then I see the album tracks
    When I play the album
    Then the Now-Playing bar shows a track
