Feature: Read along with Storyteller
  While an audiobook plays, Cadence can show the book's text with the sentence
  being narrated highlighted, karaoke-style, and let the listener tap a sentence
  to jump the audio there. The text and timing come from the CadenceConfig
  plugin's Storyteller bridge; CI fakes that bridge with Playwright route
  handlers built from the fixture book, so no real Storyteller is involved.

  Scenario: The narrated sentence is highlighted and keeps advancing
    Given the server offers Storyteller read-along for the fixture book
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I play the book from its detail page
    And I open the full player
    And I open read along
    Then the chapter text is shown with the narrated sentence highlighted
    And the highlighted sentence advances with the audio
    And no script from the chapter ran

  Scenario: Tapping a sentence seeks the audio to it
    Given the server offers Storyteller read-along for the fixture book
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I play the book from its detail page
    And I open the full player
    And I open read along
    Then the chapter text is shown with the narrated sentence highlighted
    When I tap a later sentence
    Then the audio jumps to that sentence

  Scenario: Without a linked Storyteller account, read along points at Settings
    Given the server reports my Storyteller account is not linked
    And I am signed in
    When I open the Audiobooks tab
    Then I see the audiobook library with books
    When I open the first book's detail page
    And I play the book from its detail page
    And I open the full player
    And I open read along
    Then I am told to connect Storyteller in Settings
