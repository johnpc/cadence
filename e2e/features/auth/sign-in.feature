Feature: Sign in with a Jellyfin account
  A returning user signs in with their Jellyfin credentials and lands in the
  app; a bad password is rejected; a valid session survives a reload.

  Scenario: Signing in lands on the Home tab
    Given I open the app signed out
    When I sign in with the test user's credentials
    Then I land on the Home tab

  Scenario: A wrong password is rejected
    Given I open the app signed out
    When I sign in with a wrong password
    Then I see a sign-in error

  Scenario: A valid session survives a reload
    Given I open the app signed out
    When I sign in with the test user's credentials
    And I reload the app
    Then I land on the Home tab

  Scenario: Pressing Enter submits the sign-in form
    Given I open the app signed out
    When I sign in by pressing Enter in the password field
    Then I land on the Home tab
