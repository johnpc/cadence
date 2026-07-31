Feature: Library view
  Your Library can be shown as a list or as a grid of cover tiles, and the
  choice persists.

  Scenario: Toggling Your Library between list and grid
    Given I am signed in
    When I open the Library tab
    Then the library is in list view
    When I switch the library view
    Then the library is in grid view

  Scenario: Choosing a sort order from the Your Library sort dropdown
    Given I am signed in
    When I open the Library tab
    Then the library sort is "recents"
    When I choose the "Recently added" library sort
    Then the library sort is "added"
    When I choose the "A–Z" library sort
    Then the library sort is "alpha"
