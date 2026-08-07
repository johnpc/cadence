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
    When I open the first book's detail page
    Then I see the book's title and a details block
    And I see the book's chapter or part list
