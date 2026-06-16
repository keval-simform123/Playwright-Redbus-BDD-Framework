import { test, expect } from '../fixtures/test-fixtures';
import * as path from 'path';
import * as fs from 'fs';
import { saveSession } from '../utils/db';

const SESSION_FILE = path.join(__dirname, '../playwright/.auth/session.json');

test.describe('Unified End-to-End Booking Flow with Authentication', () => {

  test('should log in manually, save session, and complete full booking flow', async ({ page, homePage, resultsPage, seatSelectionPage, passengerInfoPage, testData }) => {
    // Set timeout to 5 minutes
    test.setTimeout(300000);

    // 1. Go to RedBus homepage
    const baseURL = process.env.BASE_URL || 'https://www.redbus.in';
    console.log(`[E2E Flow] Navigating to ${baseURL}...`);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

    // 2. Click on Account
    console.log('[E2E Flow] Clicking on Account...');
    await homePage.clickAccount();

    // 3. Click on Login
    console.log('[E2E Flow] Clicking on Log in...');
    await homePage.clickLogin();

    // 4. Verify login dialog appears
    console.log('[E2E Flow] Verifying login modal is visible...');
    const mobileInput = page.locator('input#mobileNoInp, input[class*="inputFieldMobile"]').first();
    await mobileInput.waitFor({ state: 'visible', timeout: 20000 });
    console.log('[E2E Flow] Login dialog is now visible.');

    // Wait for manual login input and OTP completion
    console.log('\n==================================================================');
    console.log('[E2E Flow] ACTION REQUIRED:');
    console.log('  1. Please enter your mobile number in the headed browser.');
    console.log('  2. Complete the captcha / OTP verification manually.');
    console.log('  3. The test will automatically resume once you are logged in (dialog closes).');
    console.log('==================================================================\n');

    // Wait until the entire login overlay/backdrop disappears (up to 4 minutes / 240000ms)
    const loginOverlay = page.locator('div[class*="bottomSheetOverlay"]').first();
    await loginOverlay.waitFor({ state: 'hidden', timeout: 240000 });
    console.log('[E2E Flow] Login dialog and overlay closed successfully! Continuing...');

    // Verify successful login by checking that the "Log in" button is no longer present in the Account menu
    console.log('[E2E Flow] Verifying logged-in status...');
    await homePage.clickAccount();
    const loginButtonInDrawer = page.locator('button:has-text("Log in"), li:has-text("Log in")').first();
    
    let isStillLoggedOut = false;
    try {
      await loginButtonInDrawer.waitFor({ state: 'visible', timeout: 5000 });
      isStillLoggedOut = true;
    } catch {
      isStillLoggedOut = false;
    }

    if (isStillLoggedOut) {
      throw new Error('Login verification failed: The "Log in" button is still visible in the Account drawer. Please ensure you entered the correct OTP.');
    }
    console.log('[E2E Flow] Login successfully verified! Continuing to capture storage state...');

    // Close the Account menu so it doesn't cover elements on the homepage
    await page.keyboard.press('Escape');

    // 5. Save the baseline storage state (auth setup)
    console.log('[E2E Flow] Capturing browser context storage state...');
    const storageState = await page.context().storageState();
    
    // Save to local file
    const authDir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    fs.writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2), 'utf-8');
    console.log(`[E2E Flow] Storage state saved locally to ${SESSION_FILE}`);

    // Save to database
    try {
      await saveSession('redbus-session', JSON.stringify(storageState));
      console.log('[E2E Flow] Storage state successfully saved to MySQL database.');
    } catch (dbError) {
      console.error('[E2E Flow] Error saving session to database:', dbError);
    }

    // 6. Proceed to search for buses in the SAME session
    console.log('[E2E Flow] Starting bus search...');
    await homePage.enterFromCity(testData.fromCity);
    await homePage.enterToCity(testData.toCity);
    await homePage.selectDate(testData.travelDate);
    await homePage.clickSearch();
    
    console.log('[E2E Flow] Waiting for search results to load...');
    await resultsPage.waitForResults();
    const countBefore = await resultsPage.getResultsCount();
    expect(countBefore, 'Search should return at least one bus').toBeGreaterThan(0);

    // Apply AC filter
    console.log('[E2E Flow] Applying AC filter...');
    await resultsPage.applyAcFilter();
    const countAfter = await resultsPage.getResultsCount();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThanOrEqual(countBefore);

    // Sort by price ascending
    console.log('[E2E Flow] Sorting results by price ascending...');
    await resultsPage.sortByPrice();
    await page.waitForTimeout(3000); // allow sorting to complete and settle

    // View seats for the first available bus
    console.log('[E2E Flow] Selecting the first bus and viewing seats...');
    const viewSeatsBtn = page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.scrollIntoViewIfNeeded();
    await viewSeatsBtn.click();

    // Dismiss any login popup if it gets in the way (should already be dismissed since we are logged in, but check as a safeguard)
    await seatSelectionPage.dismissLoginPopup();

    // Wait for seat layout to load
    await seatSelectionPage.waitForSeatLayout();
    const seatLayoutVisible = await seatSelectionPage.isSeatLayoutVisible();
    expect(seatLayoutVisible, 'Seat layout should be visible').toBe(true);

    // Choose seat
    console.log('[E2E Flow] Selecting the first available seat...');
    await seatSelectionPage.selectFirstAvailableSeat();

    // Select boarding/dropping points
    await seatSelectionPage.clickSelectBoardingDroppingButton();
    const boardDropVisible = await seatSelectionPage.isBoardDropPageVisible();
    expect(boardDropVisible, 'Boarding/Dropping points page should be visible').toBe(true);

    // Boarding point
    await seatSelectionPage.selectFirstBoardingPoint();

    // Dropping point
    await seatSelectionPage.selectFirstDroppingPoint();

    // Proceed to passenger info
    console.log('[E2E Flow] Proceeding to passenger info page...');
    await seatSelectionPage.clickProceedToPassenger();

    // Wait for details form
    await passengerInfoPage.waitForPassengerInfoPage();
    const onPassengerPage = await passengerInfoPage.isOnPassengerInfoPage();
    expect(onPassengerPage, 'Should be on the Passenger Info page').toBe(true);

    // Enter contact info
    await passengerInfoPage.enterPhone('9426258120');
    await passengerInfoPage.enterEmail('keval.simformm@gmail.com');
    await passengerInfoPage.selectState('Gujarat');

    // Enter/select passenger info
    // When logged in, RedBus shows a "Co-Travellers" card list instead of blank Name/Age/Gender fields.
    // We try to select the saved passenger first; if not available, fall back to manual entry.
    const savedPassengerSelected = await passengerInfoPage.selectSavedPassengerIfAvailable();
    if (!savedPassengerSelected) {
      console.log('[E2E Flow] No saved passenger found, entering details manually...');
      await passengerInfoPage.enterName('keval');
      await passengerInfoPage.enterAge('24');
      await passengerInfoPage.selectGender('Male');
    } else {
      console.log('[E2E Flow] Saved passenger selected, skipping manual name/age/gender entry.');
    }

    // Decline cancellation and insurance options
    await passengerInfoPage.declineFreeCancellation();
    await passengerInfoPage.declineInsurance();

    // Continue to payment
    console.log('[E2E Flow] Clicking Continue booking to reach the payment page...');
    await passengerInfoPage.clickContinueBooking();

    // Wait for payment page loading and verification
    await page.waitForTimeout(8000);
    
    // Save payment page screenshot
    const paymentScreenshotPath = 'test-results/screenshots/payment-page-auth.png';
    const screenshotDir = path.dirname(paymentScreenshotPath);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: paymentScreenshotPath, fullPage: true });
    console.log(`[E2E Flow] Payment page screenshot saved to ${paymentScreenshotPath}`);

    // Verify redirection to payment options
    const onPaymentPage = await page.locator('[class*="paymentParent"], [class*="paymentWrap"], [class*="pgContainer"]')
      .first().isVisible().catch(() => false);
    const hasQR = await page.locator('img[alt*="QR"], img[src*="qr"], canvas, [class*="qrCode"], [class*="upi"]')
      .first().isVisible().catch(() => false);
    const hasPaymentText = await page.getByText(/Select a payment method|UPI|Net Banking|Debit Card|Credit Card/i)
      .first().isVisible().catch(() => false);

    expect(
      onPaymentPage || hasQR || hasPaymentText,
      'Should successfully reach the payment page'
    ).toBe(true);

    console.log('[E2E Flow] Unified test successfully completed! Reached payment stage.');
  });
});
