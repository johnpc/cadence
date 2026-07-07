Feature: App shell
  The app boots into a Spotify-style tab shell — Home, Search, and Your
  Library — with no full-library scroll, and remembers the theme choice.

  Scenario: The app boots into the Home tab with a bottom tab bar
    Given I open the app
    Then I see the "Home" tab
    And I see the "Search" tab
    And I see the "Your Library" tab

  Scenario: I can switch to the Search tab
    Given I open the app
    When I tap the "Search" tab
    Then I see the search placeholder
