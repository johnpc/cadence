@requires-deploy
Feature: Import a Deezer playlist
  A public Deezer playlist can be recreated as a Jellyfin playlist: tracks already
  in the library are added, and artists that aren't can be requested via Lidarr.
  Runs only against a live deploy (needs the CadenceConfig plugin, the public
  Deezer API, and Lidarr) — hence @requires-deploy.

  Scenario: Importing a public Deezer playlist creates a playlist and lists missing artists
    Given I am signed in
    When I open the Library tab
    And I open Import from Deezer
    And I paste a public Deezer playlist and import it
    Then I see how many tracks were added
    And I see artists I can request

  Scenario: The import flow explains how to bring a Spotify playlist over
    Given I am signed in
    When I open the Library tab
    And I open Import from Deezer
    Then I see a link explaining how to move a Spotify playlist to Deezer
