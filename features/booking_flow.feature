@e2e @booking-flow
Feature: End-to-End Bus Booking Flow
  As a registered user of RedBus
  I want to complete a full bus booking from search to payment
  So that I can book a bus ticket for my journey

  @smoke @full-booking
  Scenario: Complete booking flow from login to payment page
    Given the user is on the RedBus homepage
    # Authentication
    When the user clicks on the Account button
    And the user handles authentication if required
    And the browser session state should be saved locally
    # Bus Search
    When the user enters "Ahmedabad" as the departure city
    And the user enters "Mumbai" as the destination city
    And the user selects "18 Jul 2026" as the travel date
    And the user clicks the Search buses button
    Then the search results page should be displayed
    And the results count should be greater than 0
    # Filters
    When the user applies the AC bus filter
    Then the filtered results count should be greater than 0
    # Sort
    When the user sorts results by price
    # Seat Selection
    When the user clicks View Seats on the first bus
    And the user dismisses the login popup if present
    And the seat layout is loaded
    And the user selects the first available seat
    # Boarding/Dropping
    When the user clicks Select Boarding and Dropping Points
    And the user selects the first boarding point
    And the user selects the first dropping point
    # Proceed to Passenger Info
    When the user proceeds to passenger info page
    Then the passenger info page should be displayed
    # Passenger Details
    When the user enters phone number "9426258120"
    And the user enters email "keval.simformm@gmail.com"
    And the user selects state of residence "Gujarat"
    And the user fills passenger details automatically
    # Extras
    When the user declines free cancellation
    And the user declines insurance
    # Payment
    When the user clicks Continue Booking
    Then the payment page should be displayed
