Feature: App shell
  Signed out, the app opens on the Jellyfin sign-in screen. Once signed in it
  becomes a Spotify-style tab shell — Home, Search, and Your Library — with no
  full-library scroll.

  Scenario: Signed out, the app shows the sign-in screen
    Given I open the app
    Then I see the sign-in screen

  Scenario: Signed in, the app shows the bottom tab bar
    Given I am signed in
    Then I see the "Home" tab
    And I see the "Search" tab
    And I see the "Your Library" tab

  Scenario: I can switch to the Search tab
    Given I am signed in
    When I tap the "Search" tab
    Then I see the search placeholder
