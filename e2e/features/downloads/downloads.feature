Feature: Offline downloads
  A track can be downloaded to the device so it plays without a network
  connection — the point of the feature. Downloading stores the audio locally;
  the Downloads screen lists what's saved; and a downloaded track keeps playing
  even when the Jellyfin server is unreachable.

  Scenario: Download a track and see it in Downloads
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I download the first song result
    Then the first song result shows as downloaded
    When I open Downloads from the library
    Then I see the downloaded track

  Scenario: A downloaded track plays with no network
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I download the first song result
    And the network goes offline
    And I play the first song result
    Then the Now-Playing bar shows a track
    And the audio element is playing from a local download

  Scenario: Download a whole playlist in one tap
    Given I own a small playlist for offline download
    And I am signed in
    When I open my offline-fixture playlist
    Then I see the playlist tracks
    When I download the whole playlist
    Then the playlist shows as downloaded
    When I open Downloads from the library
    Then I see the downloaded track

  Scenario: Removing a download takes it out of Downloads
    Given I am signed in
    When I open the Search tab
    And I search for "love"
    Then I see song results
    When I download the first song result
    And I open Downloads from the library
    Then I see the downloaded track
    When I remove the first download
    Then Downloads is empty
