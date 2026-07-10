Feature: Playlist visibility (public vs private)
  A playlist's owner controls whether it is shared. A public playlist appears in
  other users' "From the community" shelf; a private one does not. This is a
  cross-user guarantee, so it is verified with TWO real Jellyfin accounts.

  Scenario: A public playlist is visible to another user; making it private hides it
    Given user two owns a fresh public playlist
    When I am signed in as user one
    And I open the Home tab
    Then I see the shared playlist in the community shelf
    When user two makes the playlist private
    And I refresh the community shelf
    Then I do not see the shared playlist in the community shelf
