Feature: Favorite playlists bubble to the top of Your Library
  A user can heart a playlist from its page. Hearted playlists sort above the
  other playlists in Your Library (just under the pinned Liked Songs), so
  favorites are easy to find.

  Scenario: Hearting a playlist bubbles it above the other playlists
    Given I am signed in
    When I open the Library tab
    And I open the first playlist
    And I favorite the playlist
    Then the playlist heart shows as on
    When I open the Library tab
    Then the favorited playlist is the first real playlist
    And I unfavorite it again to reset
