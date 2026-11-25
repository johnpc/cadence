Feature: Audiobooks library
  The Audiobooks tab lists the Jellyfin Books library as grouped books. When the
  CadenceConfig plugin is installed it serves the library precomputed in one fast
  call; without it the app falls back to a native scan. Either way the tab shows
  the same real book rows.

  Scenario: The Audiobooks tab shows real books, filterable by search
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I search the audiobooks for a book that exists
    Then I see at least one matching book

  Scenario: Opening a book shows its full detail — description, facts, and chapters
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open a multi-part book's detail page
    Then I see the book's title and a details block
    And I see the book's chapter or part list

  Scenario: An audiobook offers a playback-speed control in the player
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I play the book from its detail page
    And I open the full player
    Then I see the playback-speed control
    When I set the playback speed to 1.5x
    Then the playback speed reads "1.5×"

  Scenario: A book resumes where you left off after a reload, not from the start
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I play the book from its detail page
    And the book plays past its saved-position threshold
    And I reload the app
    Then the book resumes from where I left off

  Scenario: The player shows the part's progress and the whole book's, each labelled
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open a multi-part book's detail page
    And I play the book from its detail page
    And I open the full player
    Then I see the current part's progress labelled with its part number
    And I see the whole book's progress labelled as the book, longer than the part

  Scenario: The audiobook player fits a desktop window, transport included
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open a multi-part book's detail page
    And I play the book from its detail page
    And I open the full player
    Then the full player's play button is fully in view

  Scenario: Sharing a book copies a readable link
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I share the book
    Then the copied link is a readable link to "harbor-winds"

  Scenario: A readable book link opens the book
    Given I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I share the book
    And I open the copied link
    Then I see the book "Harbor Winds"
    When I open the book link "/audiobook/harbor-winds"
    Then I see the book "Harbor Winds"

  Scenario: A book link opened while signed out lands on the book after sign-in
    Given I open the app signed out
    When I open the readable link to the book "Harbor Winds" while signed out
    And I sign in with the test user's credentials
    Then I see the book "Harbor Winds"
