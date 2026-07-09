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

  Scenario: I can collapse the desktop sidebar
    Given I am signed in
    When I collapse the sidebar
    Then the sidebar is collapsed
    When I collapse the sidebar
    Then the sidebar is expanded

  Scenario: An unknown URL shows a Not-found page with a way home
    Given I am signed in
    When I navigate to an unknown URL
    Then I see the not-found page
    When I tap "Go home" on the not-found page
    Then I see the "Home" tab

  Scenario: Pressing "/" jumps to Search from anywhere
    Given I am signed in
    When I press the search hotkey
    Then the search box is focused

  Scenario: Losing connectivity shows an offline banner
    Given I am signed in
    When the device goes offline
    Then I see the offline banner
    When the device comes back online
    Then the offline banner is gone
