import { test, expect } from '../fixtures/test-fixtures';

test.describe('RedBus Bus Search', () => {

  // suite setup
  test.beforeAll(async () => {
    console.log('\n[Suite] Starting RedBus search test suite');
  });

  // go to home page before test starts
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // log result and screenshot if failed
  test.afterEach(async ({ page }, testInfo) => {
    const status = testInfo.status;
    console.log(`[Test] "${testInfo.title}" — ${status?.toUpperCase()}`);
    if (testInfo.status === 'failed') {
      await page.screenshot({
        path: `test-results/screenshots/FAILED-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
        fullPage: true,
      });
    }
  });

  // clean up after suite
  test.afterAll(async () => {
    console.log('[Suite] RedBus search test suite finished\n');
  });

  // test search works
  test('should search for buses and display results', {
    tag: ['@smoke', '@regression'],
  }, async ({ homePage, resultsPage, testData }) => {
    await homePage.dismissCookieBanner();
    await homePage.dismissAppDownloadBanner();
    await homePage.enterFromCity(testData.fromCity);
    await homePage.enterToCity(testData.toCity);
    await homePage.selectDate(testData.travelDate);
    await homePage.clickSearch();
    await resultsPage.waitForResults();
    const onResultsPage = await resultsPage.isOnResultsPage();
    expect(onResultsPage).toBe(true);
    const count = await resultsPage.getResultsCount();
    expect(count).toBeGreaterThan(0);
    const busDetails = await resultsPage.getFirstBusDetails();
    expect.soft(busDetails.name, 'Bus operator name should not be empty').toBeTruthy();
    expect.soft(busDetails.departureTime, 'Departure time should be visible').toBeTruthy();
    expect.soft(busDetails.price, 'Price should be visible').toBeTruthy();
    expect(
      busDetails.name || busDetails.departureTime || busDetails.price,
      'At least one bus detail (name, time, or price) should be visible on the card'
    ).toBeTruthy();
  });

  // test ac filter
  test('should filter results to show AC buses only', {
    tag: ['@regression'],
  }, async ({ homePage, resultsPage, testData }) => {
    await homePage.dismissCookieBanner();
    await homePage.dismissAppDownloadBanner();
    await homePage.enterFromCity(testData.fromCity);
    await homePage.enterToCity(testData.toCity);
    await homePage.selectDate(testData.travelDate);
    await homePage.clickSearch();
    await resultsPage.waitForResults();
    const countBefore = await resultsPage.getResultsCount();
    expect(countBefore).toBeGreaterThan(0);
    await resultsPage.applyAcFilter();
    const countAfter = await resultsPage.getResultsCount();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  // check that we can pick weekends
  test('should handle weekend date selection correctly', {
    tag: ['@regression'],
  }, async ({ homePage, resultsPage }) => {
    await homePage.dismissCookieBanner();
    await homePage.dismissAppDownloadBanner();

    // enter cities
    await homePage.enterFromCity('Ahmedabad');
    await homePage.enterToCity('Mumbai');

    // pick saturday or sunday
    const selectedDateLabel = await homePage.selectWeekendDate();

    // check that label has weekend day
    expect(
      selectedDateLabel,
      'Selected date aria-label should mention Saturday or Sunday'
    ).toMatch(/Saturday|Sunday/);

    // check results
    await homePage.clickSearch();
    await resultsPage.waitForResults();

    const onResultsPage = await resultsPage.isOnResultsPage();
    expect(onResultsPage, 'Should navigate to results page after selecting weekend date').toBe(true);

    const count = await resultsPage.getResultsCount();
    expect(count, 'Should find buses available on the weekend date').toBeGreaterThan(0);
  });

  // check that price sorting works
  test('should sort results by price ascending', {
    tag: ['@regression'],
  }, async ({ homePage, resultsPage, testData }) => {
    await homePage.dismissCookieBanner();
    await homePage.dismissAppDownloadBanner();
    await homePage.enterFromCity(testData.fromCity);
    await homePage.enterToCity(testData.toCity);
    await homePage.selectDate(testData.travelDate);
    await homePage.clickSearch();
    await resultsPage.waitForResults();

    // get prices before sort
    const pricesBefore = await resultsPage.getVisibleBusPrices();
    expect(pricesBefore.length, 'Should have visible bus prices before sort').toBeGreaterThan(0);

    // click sort
    await resultsPage.sortByPrice();

    // get prices after sort
    const pricesAfter = await resultsPage.getVisibleBusPrices();
    expect(pricesAfter.length, 'Should have visible bus prices after sort').toBeGreaterThan(0);

    // check if they are sorted
    let isSortedAscending = true;
    for (let i = 0; i < pricesAfter.length - 1; i++) {
      if (pricesAfter[i] > pricesAfter[i + 1]) {
        isSortedAscending = false;
        break;
      }
    }
    expect(
      isSortedAscending,
      `Prices after sort should be ascending. Got: [${pricesAfter.join(', ')}]`
    ).toBe(true);
  });

  // end to end booking flow
  test('should complete full booking flow through passenger info', {
    tag: ['@regression', '@booking'],
    timeout: 120_000, // This flow involves 16 steps across multiple pages
  }, async ({ page, homePage, resultsPage, seatSelectionPage, passengerInfoPage, testData }) => {
    // Search THE BUS
    await homePage.dismissCookieBanner();
    await homePage.dismissAppDownloadBanner();
    await homePage.enterFromCity(testData.fromCity);
    await homePage.enterToCity(testData.toCity);
    await homePage.selectDate(testData.travelDate);
    await homePage.clickSearch();
    await resultsPage.waitForResults();
    const count = await resultsPage.getResultsCount();
    expect(count, 'Search should return at least one bus').toBeGreaterThan(0);

    // View seats
    const viewSeatsBtn = page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.scrollIntoViewIfNeeded();
    await viewSeatsBtn.click();

    // Dismiss login popup
    await seatSelectionPage.dismissLoginPopup();

    // Wait for seats to load
    await seatSelectionPage.waitForSeatLayout();
    const seatLayoutVisible = await seatSelectionPage.isSeatLayoutVisible();
    expect(seatLayoutVisible, 'Seat layout should be visible').toBe(true);

    // Choose seat
    await seatSelectionPage.selectFirstAvailableSeat();

    // Select boarding/dropping
    await seatSelectionPage.clickSelectBoardingDroppingButton();

    // Check board/drop page is up
    const boardDropVisible = await seatSelectionPage.isBoardDropPageVisible();
    expect(boardDropVisible, 'Boarding/Dropping points page should be visible').toBe(true);

    // Boarding point
    await seatSelectionPage.selectFirstBoardingPoint();

    // Dropping point
    await seatSelectionPage.selectFirstDroppingPoint();

    // Proceed to passenger info
    await seatSelectionPage.clickProceedToPassenger();

    // Wait for details form
    await passengerInfoPage.waitForPassengerInfoPage();
    const onPassengerPage = await passengerInfoPage.isOnPassengerInfoPage();
    expect(onPassengerPage, 'Should be on the Passenger Info page').toBe(true);

    // Enter contact info
    await passengerInfoPage.enterPhone('9426258120');
    await passengerInfoPage.enterEmail('keval.simformm@gmail.com');
    await passengerInfoPage.selectState('Gujarat');

    // Enter passenger info
    await passengerInfoPage.enterName('keval');
    await passengerInfoPage.enterAge('24');
    await passengerInfoPage.selectGender('Male');

    // Say no to cancellation and insurance
    await passengerInfoPage.declineFreeCancellation();
    await passengerInfoPage.declineInsurance();

    // Continue
    await passengerInfoPage.clickContinueBooking();

    // Wait for payment screen
    await page.waitForTimeout(8000);

    // Save screenshot for proof
    await page.screenshot({
      path: 'test-results/screenshots/payment-page.png',
      fullPage: true,
    });

    // Make sure gender got selected
    const genderError = await page.getByText('Please select valid gender').isVisible().catch(() => false);
    expect(genderError, 'Gender should have been selected — no validation error').toBe(false);

    // Verify we got redirected to payment
    const onPaymentPage = await page.locator('[class*="paymentParent"], [class*="paymentWrap"], [class*="pgContainer"]')
      .first().isVisible().catch(() => false);
    const hasQR = await page.locator('img[alt*="QR"], img[src*="qr"], canvas, [class*="qrCode"], [class*="upi"]')
      .first().isVisible().catch(() => false);
    const hasPaymentText = await page.getByText(/Select a payment method|UPI|Net Banking|Debit Card|Credit Card/i)
      .first().isVisible().catch(() => false);

    expect(
      onPaymentPage || hasQR || hasPaymentText,
      'Should reach the payment page with QR code or payment options'
    ).toBe(true);

    console.log('[Test] Full booking flow completed — payment page reached.');
  });

});
