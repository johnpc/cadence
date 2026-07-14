Feature: Home recommendations
  Home is the Spotify-style recommendation surface: horizontal shelves of real
  albums and songs from the Jellyfin library, with no full-library scroll.

  Scenario: Home shows a recommendation shelf and opens an album
    Given I am signed in
    Then I see the Recently added shelf with albums
    When I open the first album on Home
    Then I see the album tracks

  Scenario: The card play button plays without leaving Home
    Given I am signed in
    Then I see the Recently added shelf with albums
    When I play the first album on Home via its play button
    Then the Now-Playing bar shows a track
    And I am still on Home

  Scenario: Following an artist surfaces a "Made for you" mix on Home
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    And I open the first artist result
    Then I see the artist's albums
    When I follow the artist
    And I open the Home tab
    Then I see a "Made for you" mix
    When I play the first mix
    Then the Now-Playing bar shows a track

  Scenario: Playing a track then opening the full Recently played history
    Given I am signed in
    When I tap a track from search
    And I open the Home tab
    And I open the full play history
    Then I see the play history list

  Scenario: Playing a track surfaces a "Made for you" mix without following anyone
    Given I am signed in
    When I tap a track from search
    And I open the Home tab
    Then I see a "Made for you" mix

  Scenario: Home surfaces an "On repeat" shelf of your most-played tracks
    Given I am signed in
    When I tap a track from search
    And I open the Home tab
    Then I see an "On repeat" shelf

  Scenario: Playing a collection surfaces a "Jump back in" shelf on Home
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    Then I see the playlist tracks
    When I play the playlist
    And I open the Home tab
    Then I see a "Jump back in" shelf
