@requires-deploy
Feature: Grab a track that isn't in the library
  When Search comes up empty, a user can grab that single song from the
  self-hosted Music Grabber service — it downloads into the same Jellyfin library
  Cadence reads. Runs only against a live deploy (needs the Music Grabber service
  reachable over HTTPS + CORS, and it configured in Settings) — hence
  @requires-deploy.

  Scenario: An empty search offers to grab the track
    Given I am signed in
    When I open the Search tab
    And I search for "zzzxqqwvnotarealthing"
    Then I see the no-results state
    And I see the option to grab the track

  Scenario: Grabbing a track from the grab sheet starts a download
    Given I am signed in
    When I open the Search tab
    And I search for "radiohead creep obscure b-side"
    And I choose to grab the track
    Then I see grabbable results
    When I grab the first result
    Then I am told the track is being grabbed
