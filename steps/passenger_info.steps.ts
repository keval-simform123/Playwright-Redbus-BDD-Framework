import { Given, When, Then, expect } from './fixtures';
import * as path from 'path';
import * as fs from 'fs';

When('the user enters phone number {string}', async ({ passengerInfoPage }, phone: string) => {
  console.log(`[Passenger] Phone: ${phone}`);
  await passengerInfoPage.enterPhone(phone);
});

When('the user enters email {string}', async ({ passengerInfoPage }, email: string) => {
  console.log(`[Passenger] Email: ${email}`);
  await passengerInfoPage.enterEmail(email);
});

When('the user selects state of residence {string}', async ({ passengerInfoPage }, state: string) => {
  console.log(`[Passenger] State: ${state}`);
  await passengerInfoPage.selectState(state);
});

Then('the contact information should be filled successfully', async ({ passengerInfoPage }) => {
  const onPage = await passengerInfoPage.isOnPassengerInfoPage();
  expect(onPage, 'Should be on passenger info page').toBe(true);
  console.log('[Passenger] Contact info filled.');
});

When('no saved passenger is available', async ({ passengerInfoPage }) => {
  const saved = await passengerInfoPage.selectSavedPassengerIfAvailable();
  if (saved) {
    console.log('[Passenger] Saved passenger selected, skipping manual entry.');
  } else {
    console.log('[Passenger] No saved passenger, manual entry needed.');
  }
});

When('the user enters passenger name {string}', async ({ passengerInfoPage }, name: string) => {
  console.log(`[Passenger] Name: ${name}`);
  await passengerInfoPage.enterName(name);
});

When('the user enters passenger age {string}', async ({ passengerInfoPage }, age: string) => {
  console.log(`[Passenger] Age: ${age}`);
  await passengerInfoPage.enterAge(age);
});

When('the user selects passenger gender {string}', async ({ passengerInfoPage }, gender: string) => {
  console.log(`[Passenger] Gender: ${gender}`);
  await passengerInfoPage.selectGender(gender as 'Male' | 'Female');
});

Then('the passenger details should be filled successfully', async ({ passengerInfoPage }) => {
  const onPage = await passengerInfoPage.isOnPassengerInfoPage();
  expect(onPage, 'Should be on passenger info page').toBe(true);
  console.log('[Passenger] Details filled.');
});

When('the user fills passenger details automatically', async ({ passengerInfoPage }) => {
  const savedPassengerSelected = await passengerInfoPage.selectSavedPassengerIfAvailable();
  if (!savedPassengerSelected) {
    console.log('[Passenger] No saved passenger, entering manually...');
    await passengerInfoPage.enterName('keval');
    await passengerInfoPage.enterAge('24');
    await passengerInfoPage.selectGender('Male');
  } else {
    console.log('[Passenger] Saved passenger selected.');
  }
});

When('the user declines free cancellation', async ({ passengerInfoPage }) => {
  console.log('[Passenger] Declining free cancellation...');
  await passengerInfoPage.declineFreeCancellation();
});

When('the user declines insurance', async ({ passengerInfoPage }) => {
  console.log('[Passenger] Declining insurance...');
  await passengerInfoPage.declineInsurance();
});

Then('the extras should be declined successfully', async ({ passengerInfoPage }) => {
  const onPage = await passengerInfoPage.isOnPassengerInfoPage();
  expect(onPage, 'Should be on passenger info page').toBe(true);
  console.log('[Passenger] Extras declined.');
});

When('the user clicks Continue Booking', async ({ passengerInfoPage }) => {
  console.log('[Passenger] Clicking Continue Booking...');
  await passengerInfoPage.clickContinueBooking();
});

Then('the passenger info page should be displayed', async ({ passengerInfoPage }) => {
  await passengerInfoPage.waitForPassengerInfoPage();
  const onPage = await passengerInfoPage.isOnPassengerInfoPage();
  expect(onPage, 'Should be on Passenger Info page').toBe(true);
  console.log('[Passenger] Page displayed.');
});

Then('the payment page should be displayed', async ({ page }) => {
  await page.waitForTimeout(8000);

  // save screenshot for debugging
  const screenshotPath = 'test-results/screenshots/payment-page-bdd.png';
  const screenshotDir = path.dirname(screenshotPath);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[Payment] Screenshot saved to ${screenshotPath}`);

  const onPaymentPage = await page.locator('[class*="paymentParent"], [class*="paymentWrap"], [class*="pgContainer"]')
    .first().isVisible().catch(() => false);
  const hasQR = await page.locator('img[alt*="QR"], img[src*="qr"], canvas, [class*="qrCode"], [class*="upi"]')
    .first().isVisible().catch(() => false);
  const hasPaymentText = await page.getByText(/Select a payment method|UPI|Net Banking|Debit Card|Credit Card/i)
    .first().isVisible().catch(() => false);

  expect(
    onPaymentPage || hasQR || hasPaymentText,
    'Should reach payment page'
  ).toBe(true);
  console.log('[Payment] Payment page verified.');
});
