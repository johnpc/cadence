Feature: See which audiobooks can be read along
  The Books tab marks the books whose text Storyteller has synced with the
  audio, so a listener can find something to read along without opening every
  book. A filter narrows the list to just those books. The marks come from the
  CadenceConfig plugin's library list; CI fakes it with Playwright route
  handlers keyed by the fixture books' real item ids.

  Scenario: Books ready to read along are marked in the Books list
    Given the server offers Storyteller read-along for the fixture book
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    And "Harbor Winds" is marked ready to read along
    And "The Lighthouse Letters" is marked as still aligning

  Scenario: The Read along filter shows only those books
    Given the server offers Storyteller read-along for the fixture book
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I filter the books to "Read along"
    Then only "Harbor Winds" is listed
    When I filter the books to "All"
    Then "The Lighthouse Letters" is listed again

  Scenario: A book that is still aligning says so on its page
    Given the server offers Storyteller read-along for the fixture book
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the book "The Lighthouse Letters"
    Then the book's page says it is still aligning
