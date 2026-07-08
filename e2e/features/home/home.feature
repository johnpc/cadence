Feature: Home recommendations
  Home is the Spotify-style recommendation surface: horizontal shelves of real
  albums and songs from the Jellyfin library, with no full-library scroll.

  Scenario: Home shows a recommendation shelf and plays an album
    Given I am signed in
    Then I see the Recently added shelf with albums
    When I play the first album on Home
    Then the Now-Playing bar shows a track
